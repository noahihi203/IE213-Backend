import { Types } from "mongoose";
import { AuthFailureError, BadRequestError } from "../core/error.response.js";
import { userModel } from "../models/user.model.js";
import NotificationService from "./notification.service.js";
import bcrypt from "bcrypt";
import logger from "../config/logger.config.js";
import { redisService } from "./redis.service.js";

interface UserFindByEmail {
  email: string;
  select?: Record<string, number>;
}

interface UserFindById {
  _id: string;
  select?: Record<string, number>;
}

interface followPayload {
  userId: Types.ObjectId;
  followerId: Types.ObjectId;
}

// Updated to make fields optional for partial updates
interface UpdateInput {
  fullName?: string;
  bio?: string;
  avatar?: string;
}

interface ChangeEmailInput {
  currentPassword: string;
  newEmail: string;
}

class UserService {
  private static async safeRedisGet<T>(key: string): Promise<T | null> {
    try {
      return await redisService.get<T>(key);
    } catch {
      return null;
    }
  }

  private static async safeRedisSetWithTTL(
    key: string,
    value: any,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await redisService.setWithTTL(key, value, ttlSeconds);
    } catch {
      // ignore cache errors
    }
  }

  private static async safeRedisDel(key: string | string[]): Promise<void> {
    try {
      await redisService.del(key);
    } catch {
      // ignore cache errors
    }
  }

  private static async safeRedisPublish(
    channel: string,
    message: any,
  ): Promise<void> {
    try {
      await redisService.publish(channel, message);
    } catch {
      // ignore cache errors
    }
  }

  static findUserByEmail = async ({
    email,
    select = {
      email: 1,
      password: 1,
      fullName: 1,
      username: 1,
      role: 1,
      tokenVersion: 1,
    },
  }: UserFindByEmail) => {
    return await userModel.findOne({ email }).select(select).lean();
  };

  static getUserById = async ({
    _id,
    select = {
      email: 1,
      password: 1,
      fullName: 1,
      username: 1,
      bio: 1,
      avatar: 1,
      role: 1,
      tokenVersion: 1,
    },
  }: UserFindById) => {
    const CACHE_KEY = `user:profile:${_id}`;
    const TTL = 600; // 10 phút

    const cachedProfile = await UserService.safeRedisGet(CACHE_KEY);
    if (cachedProfile) return cachedProfile;

    logger.debug("userid", _id);
    const profile = await userModel.findOne({ _id }).select(select).lean();

    if (profile) await UserService.safeRedisSetWithTTL(CACHE_KEY, profile, TTL);
    return profile;
  };

  static updateProfile = async (updateInput: UpdateInput, userId: string) => {
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateInput },
        { new: true, runValidators: true },
      )
      .select("email fullName username bio avatar role");

    if (!updatedUser) {
      throw new BadRequestError("User not found");
    }

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return updatedUser;
  };

  static changeEmail = async (
    changeEmailInput: ChangeEmailInput,
    userId: string,
  ) => {
    const newEmailExist = await userModel.findOne({
      email: changeEmailInput.newEmail,
    });
    if (newEmailExist) throw new BadRequestError("Email is existed");

    const foundUser = await userModel.findById(userId);
    if (!foundUser) throw new BadRequestError("User not existed!");

    const match = await bcrypt.compare(
      changeEmailInput.currentPassword,
      foundUser.password,
    );
    if (!match) throw new AuthFailureError("Authentication error");

    // send email xac nhan
    ///
    ///
    ///

    const updateEmail = await userModel
      .findByIdAndUpdate(userId, { $set: { email: changeEmailInput.newEmail } }, { new: true })
      .select("email fullName username bio avatar role");

    if (!updateEmail)
      throw new BadRequestError("User not found, update failed!");

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return updateEmail;
  };

  static changeUserName = async (userId: string, newUsername: string) => {
    // FIX: Changed from find() to findOne()
    const foundUser = await userModel
      .findOne({ username: newUsername })
      .select("_id");
    if (foundUser) throw new BadRequestError("username is existed");

    const updateUsername = await userModel
      .findByIdAndUpdate(userId, {
        $set: { username: newUsername },
      })
      .select("email fullName username bio avatar role");

    if (!updateUsername)
      throw new BadRequestError("User not found, update username failed");

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return updateUsername;
  };

  // NEW: Password update method
  static updatePassword = async (
    userId: string,
    currentPass: string,
    newPass: string,
  ) => {
    const foundUser = await userModel.findById(userId);
    if (!foundUser) throw new BadRequestError("User not found!");

    const match = await bcrypt.compare(currentPass, foundUser.password);
    if (!match) throw new AuthFailureError("Current password is incorrect");

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPass, saltRounds);

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { 
        $set: { password: hashedNewPassword },
        $inc: { tokenVersion: 1 } 
      },
      { new: true }
    );

    if (!updatedUser) throw new BadRequestError("Failed to update password");

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return true; 
  };

  static getAllUsersWithPagination = async ({
    page = 1,
    limit = 10,
    search = "",
    role,
    isActive,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => {
    if (page < 1) {
      throw new BadRequestError("Page must be greater than 0");
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    const filter: any = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      if (!["admin", "user", "author"].includes(role)) {
        throw new BadRequestError("Invalid role filter");
      }
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      userModel
        .find(filter)
        .select("-password")
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      userModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    };
  };

  static deleteUserById = async (userId: string) => {
    const deletedUser = await userModel
      .findByIdAndUpdate(userId, { $set: { isActive: false } }, { new: true })
      .select("-password");

    if (!deletedUser) {
      throw new BadRequestError("User not found");
    }

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return deletedUser;
  };

  static restoreUserById = async (userId: string) => {
    const restoredUser = await userModel
      .findByIdAndUpdate(userId, { $set: { isActive: true } }, { new: true })
      .select("-password");

    if (!restoredUser) {
      throw new BadRequestError("User not found");
    }

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return restoredUser;
  };

  static updateUserRole = async ({
    userId,
    newRole,
  }: {
    userId: string;
    newRole: string;
  }) => {
    const validRoles = ["admin", "user", "author"];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestError(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      );
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: { role: newRole },
          $inc: { tokenVersion: 1 }, 
        },
        { new: true, runValidators: true },
      )
      .select("-password");

    if (!updatedUser) {
      throw new BadRequestError("User not found");
    }

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return updatedUser;
  };

  static followUser = async (payload: followPayload) => {
    const follow = await userModel.findByIdAndUpdate(
      payload.userId,
      {
        $addToSet: { followers: payload.followerId },
      },
      { new: true },
    );

    if (!follow) throw new BadRequestError("Follow failed!");
    else {
      const noti = await NotificationService.notifyOnUser({
        userId: payload.userId,
        actorId: payload.followerId,
        type: "follow",
        message: "follow you",
      });
      return {
        follow,
        noti,
      };
    }
  };
}

export default UserService;