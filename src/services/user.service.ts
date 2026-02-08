import { BadRequestError } from "../core/error.response.js";
import { userModel } from "../models/user.model.js";

interface UserFindByEmail {
  email: string;
  select?: Record<string, number>;
}

interface UserFindById {
  _id: string;
  select?: Record<string, number>;
}

class UserService {
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
      role: 1,
      tokenVersion: 1,
    },
  }: UserFindById) => {
    console.log("userid", _id);
    return await userModel.findOne({ _id }).select(select).lean();
  };

  static updateUser = async ({
    userId,
    updateData,
  }: {
    userId: string;
    updateData: Partial<{
      fullName: string;
      bio: string;
      avatar: string;
      email: string;
      username: string;
    }>;
  }) => {
    // 1. Validate input fields
    const allowedFields = ["fullName", "bio", "avatar", "email", "username"];
    const updateFields = Object.keys(updateData);

    const invalidFields = updateFields.filter(
      (field) => !allowedFields.includes(field),
    );
    if (invalidFields.length > 0) {
      throw new BadRequestError(`Invalid fields: ${invalidFields.join(", ")}`);
    }

    // 2. Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new BadRequestError("Invalid email format");
      }

      // Check email uniqueness
      const existingUser = await userModel.findOne({
        email: updateData.email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new BadRequestError("Email already exists");
      }
    }

    // 3. Validate username if provided
    if (updateData.username) {
      if (updateData.username.length < 3 || updateData.username.length > 30) {
        throw new BadRequestError(
          "Username must be between 3 and 30 characters",
        );
      }

      // Check username uniqueness
      const existingUser = await userModel.findOne({
        username: updateData.username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new BadRequestError("Username already exists");
      }
    }

    // 4. Validate fullName if provided
    if (updateData.fullName && updateData.fullName.trim().length < 2) {
      throw new BadRequestError("Full name must be at least 2 characters");
    }

    // 5. Validate bio length
    if (updateData.bio && updateData.bio.length > 500) {
      throw new BadRequestError("Bio cannot exceed 500 characters");
    }

    // Update user
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .select("-password");

    if (!updatedUser) {
      throw new BadRequestError("User not found");
    }

    return updatedUser;
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

    return deletedUser;
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

    return updatedUser;
  };
}

export default UserService;
