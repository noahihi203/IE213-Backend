import { Types } from "mongoose";
import {
  AuthFailureError,
  BadRequestError,
  NotFoundError,
} from "../core/error.response.js";
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

interface UpdateInput {
  fullName: string;
  bio: string;
  avatar: string | null;
}

interface ChangeEmailInput {
  currentPassword: string;
  newEmail: string;
}

interface FollowListInput {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
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
      fullName: 1,
      avatar: 1,
      bio: 1,
      username: 1,
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
    const normalizedUpdateInput = {
      ...updateInput,
      avatar:
        updateInput.avatar && updateInput.avatar.trim()
          ? updateInput.avatar
          : null,
    };

    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { $set: normalizedUpdateInput },
        { new: true, runValidators: true },
      )
      .select("bio avatar fullName");

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
    const nextEmail = changeEmailInput.newEmail.trim().toLowerCase();
    const newEmailExist = await userModel.findOne({
      email: nextEmail,
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
      .findByIdAndUpdate(userId, { $set: { email: nextEmail } }, { new: true })
      .select("email");

    if (!updateEmail)
      throw new BadRequestError("User not found, update failed!");

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return updateEmail;
  };

  static changeUserName = async (userId: string, newUsername: string) => {
    const nextUsername = newUsername.trim();
    if (!nextUsername) {
      throw new BadRequestError("username is required");
    }

    const foundUser = await userModel
      .findOne({ username: nextUsername })
      .lean();
    if (foundUser && foundUser._id.toString() !== userId)
      throw new BadRequestError("username is existed");

    const updateUsername = await userModel
      .findByIdAndUpdate(userId, {
        $set: { username: nextUsername },
      })
      .select("username");

    if (!updateUsername)
      throw new BadRequestError("User not found, update username failed");

    await UserService.safeRedisDel(`user:profile:${userId}`);

    return updateUsername;
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
    // Validate pagination parameters
    if (page < 1) {
      throw new BadRequestError("Page must be greater than 0");
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    // Build filter query
    const filter: any = {};

    // Search by username, email, or fullName
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      if (!["admin", "user", "author"].includes(role)) {
        throw new BadRequestError("Invalid role filter");
      }
      filter.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Execute query with pagination
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

    // Calculate pagination metadata
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
    // Soft delete - change status to inactive
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
    // Restore user - change status back to active
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
    // Validate role
    const validRoles = ["admin", "user", "author"];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestError(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      );
    }

    // Update user role AND increment tokenVersion to invalidate old tokens
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: { role: newRole },
          $inc: { tokenVersion: 1 }, // Increment version to invalidate all existing tokens
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
    const { userId, followerId } = payload;

    if (!userId || !followerId) {
      throw new BadRequestError("Missing follow payload");
    }

    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(followerId)
    ) {
      throw new BadRequestError("Invalid user id");
    }

    if (userId.toString() === followerId.toString()) {
      throw new BadRequestError("You cannot follow yourself");
    }

    const [targetUser, actorUser] = await Promise.all([
      userModel.findById(userId).select("_id isActive followers").lean(),
      userModel.findById(followerId).select("_id isActive").lean(),
    ]);

    if (!targetUser) {
      throw new NotFoundError("User to follow not found");
    }

    if (!actorUser) {
      throw new NotFoundError("Follower user not found");
    }

    if (!targetUser.isActive) {
      throw new BadRequestError("Cannot follow inactive user");
    }

    if (!actorUser.isActive) {
      throw new BadRequestError("Inactive users cannot follow others");
    }

    const alreadyFollowing =
      targetUser.followers?.some(
        (item) => item.toString() === followerId.toString(),
      ) ?? false;

    if (alreadyFollowing) {
      const follow = await userModel
        .findById(userId)
        .select("-password")
        .lean();
      return {
        follow,
        noti: null,
        isFollowing: true,
        isNewFollow: false,
      };
    }

    await Promise.all([
      userModel.updateOne(
        { _id: userId },
        { $addToSet: { followers: followerId } },
      ),
      userModel.updateOne(
        { _id: followerId },
        { $addToSet: { following: userId } },
      ),
      UserService.safeRedisDel([
        `user:profile:${userId.toString()}`,
        `user:profile:${followerId.toString()}`,
      ]),
    ]);

    const follow = await userModel.findById(userId).select("-password").lean();

    if (!follow) {
      throw new BadRequestError("Follow failed!");
    }

    let noti: unknown = null;
    try {
      noti = await NotificationService.notifyOnUser({
        userId,
        actorId: followerId,
        type: "follow",
        message: "follow you",
      });
    } catch (error) {
      logger.warn("Failed to send follow notification", {
        userId: userId.toString(),
        followerId: followerId.toString(),
        error: error instanceof Error ? error.message : error,
      });
    }

    return {
      follow,
      noti,
      isFollowing: true,
      isNewFollow: true,
    };
  };

  static getMyFollowers = async ({
    userId,
    page = 1,
    limit = 10,
    search = "",
  }: FollowListInput) => {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError("Invalid user id");
    }

    if (page < 1) {
      throw new BadRequestError("Page must be greater than 0");
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    const me = await userModel.findById(userId).select("followers").lean();
    if (!me) {
      throw new NotFoundError("User not found");
    }

    const followerIds = (me.followers || []).map((id) => id.toString());

    if (followerIds.length === 0) {
      return {
        followers: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalUsers: 0,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const filter: {
      _id: { $in: string[] };
      isActive: boolean;
      $or?: Array<
        | { username: { $regex: string; $options: string } }
        | { fullName: { $regex: string; $options: string } }
        | { email: { $regex: string; $options: string } }
      >;
    } = {
      _id: { $in: followerIds },
      isActive: true,
    };

    if (search.trim()) {
      const normalizedSearch = search.trim();
      filter.$or = [
        { username: { $regex: normalizedSearch, $options: "i" } },
        { fullName: { $regex: normalizedSearch, $options: "i" } },
        { email: { $regex: normalizedSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [followers, totalUsers] = await Promise.all([
      userModel
        .find(filter)
        .select("_id username fullName email avatar bio role isActive")
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      userModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

    return {
      followers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  };

  static getMyFollowing = async ({
    userId,
    page = 1,
    limit = 10,
    search = "",
  }: FollowListInput) => {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestError("Invalid user id");
    }

    if (page < 1) {
      throw new BadRequestError("Page must be greater than 0");
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    const me = await userModel.findById(userId).select("following").lean();
    if (!me) {
      throw new NotFoundError("User not found");
    }

    const followingIds = (me.following || []).map((id) => id.toString());

    if (followingIds.length === 0) {
      return {
        following: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalUsers: 0,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const filter: {
      _id: { $in: string[] };
      isActive: boolean;
      $or?: Array<
        | { username: { $regex: string; $options: string } }
        | { fullName: { $regex: string; $options: string } }
        | { email: { $regex: string; $options: string } }
      >;
    } = {
      _id: { $in: followingIds },
      isActive: true,
    };

    if (search.trim()) {
      const normalizedSearch = search.trim();
      filter.$or = [
        { username: { $regex: normalizedSearch, $options: "i" } },
        { fullName: { $regex: normalizedSearch, $options: "i" } },
        { email: { $regex: normalizedSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [following, totalUsers] = await Promise.all([
      userModel
        .find(filter)
        .select("_id username fullName email avatar bio role isActive")
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      userModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

    return {
      following,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  };
}

export default UserService;
