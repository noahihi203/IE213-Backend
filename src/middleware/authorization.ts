import { Request, Response, NextFunction } from "express";
import {
  BadRequestError,
  ForBiddenError,
  AdminErrorCodes,
  AdminErrorMessages,
} from "../core/error.response.js";
import { userModel } from "../models/user.model.js";
import { adminConfig } from "../config/admin.config.js";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role?: string;
        isSuperAdmin?: boolean;
      };
    }
  }
}

/**
 * Middleware to check if user has admin role
 * Must be used after authentication middleware
 */
export const checkAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    throw new ForBiddenError("Authentication required");
  }

  if (user.role !== "admin") {
    throw new ForBiddenError("Admin access required");
  }

  next();
};

export const checkNotSelfDemotion = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.params.userId;
  const currentUser = req.user;
  const newRole = req.body;

  if (!userId || !currentUser || !newRole) {
    throw new ForBiddenError("Authentication required");
  }

  const currentUserId = currentUser?.userId;
  const currentUserRole = currentUser?.role;

  if (userId === currentUserId) {
    if (currentUserRole === "admin" && newRole !== "admin")
      throw new ForBiddenError(
        AdminErrorMessages.SELF_DEMOTION_FORBIDDEN,
        403,
        AdminErrorCodes.SELF_DEMOTION_FORBIDDEN,
      );
  }
  next();
};

export const checkSuperAdminProtection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.params.userId;
  if (!userId) {
    throw new ForBiddenError("userId not in params");
  }

  const user = await userModel
    .findOne({ _id: userId })
    .select("isSuperAdmin")
    .lean();
  if (!user) {
    throw new ForBiddenError("User not found!");
  }
  if (user.isSuperAdmin === true || userId === adminConfig.superAdminId) {
    throw new ForBiddenError(
      AdminErrorMessages.SUPER_ADMIN_PROTECTED,
      403,
      AdminErrorCodes.SUPER_ADMIN_PROTECTED,
    );
  }

  next();
};

export const checkAdminToAdminPermission = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const targetUser = await userModel
    .findOne({ _id: req.params.userId })
    .select("role")
    .lean();
  if (!targetUser) {
    throw new ForBiddenError("User not found 1!");
  }
  const currentUser = req.user;
  if (!currentUser) {
    throw new ForBiddenError("Authentication required");
  }
  const superAdmin = await userModel
    .findOne({ _id: currentUser.userId })
    .select("isSuperAdmin")
    .lean();
  if (!superAdmin) {
    throw new ForBiddenError("User not found 2!");
  }
  console.log("superAdmin superAdmin", superAdmin);

  if (targetUser.role === "admin") {
    if (currentUser.role === "admin" && !superAdmin.isSuperAdmin) {
      throw new ForBiddenError(
        AdminErrorMessages.INSUFFICIENT_ADMIN_PERMISSION,
        403,
        AdminErrorCodes.INSUFFICIENT_ADMIN_PERMISSION,
      );
    }
  }
  next();
};

export const checkMinimumAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.params.userId;
  if (!userId) {
    throw new ForBiddenError("userId not in params");
  }
  const targetUser = await userModel
    .findOne({ _id: userId })
    .select("role")
    .lean();
  if (!targetUser) {
    throw new ForBiddenError("User not found!");
  }
  const newRole = req.body.role;
  if (!newRole) {
    throw new ForBiddenError("newRole is not in body!");
  }

  if (targetUser.role === "admin" && newRole !== "admin") {
    const activeAdminCount = await userModel.countDocuments({
      role: "admin",
      isActive: true,
    });
    if (activeAdminCount <= adminConfig.minActiveAdmins) {
      throw new ForBiddenError(
        AdminErrorMessages.MINIMUM_ADMINS_REQUIRED,
        403,
        AdminErrorCodes.MINIMUM_ADMINS_REQUIRED,
      );
    } else {
      next();
    }
  }
  next();
};
// if target user role !== admin, newRole === admin => tang cap len admin
export const checkMaximumAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const targetUserId = req.params.userId;
  if (!targetUserId) {
    throw new ForBiddenError("userId is not in params!");
  }

  const targetUser = await userModel
    .findOne({ _id: targetUserId })
    .select("role")
    .lean();
  if (!targetUser) {
    throw new ForBiddenError("User not found!");
  }

  const newRole = req.body.role;
  if (!newRole) {
    throw new ForBiddenError("newRole is not in body!");
  }

  if (targetUser.role !== "admin" && newRole === "admin") {
    const activeAdminCount = await userModel.countDocuments({
      role: "admin",
      isActive: true,
    });
    if (activeAdminCount >= adminConfig.maxActiveAdmins) {
      throw new ForBiddenError(
        AdminErrorMessages.MAXIMUM_ADMINS_REACHED,
        403,
        AdminErrorCodes.MAXIMUM_ADMINS_REACHED,
      );
    } else {
      next();
    }
  }
  next();
};

/**
 * Middleware to check if user has specific roles
 * @param roles - Array of allowed roles
 */
export const checkRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      throw new ForBiddenError("Authentication required");
    }

    if (!user.role || !roles.includes(user.role)) {
      throw new ForBiddenError(
        `Access denied. Required roles: ${roles.join(", ")}`,
      );
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or is admin
 * @param resourceIdParam - Name of the parameter containing resource owner ID
 */
export const checkOwnershipOrAdmin = (resourceIdParam: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    console.log("user", user);

    if (!user) {
      throw new ForBiddenError("Authentication required");
    }

    const resourceOwnerId = req.params[resourceIdParam];

    // Allow if user is admin or owns the resource
    if (user.role === "admin" || user.userId === resourceOwnerId) {
      next();
    } else {
      throw new ForBiddenError(
        "You don't have permission to access this resource",
      );
    }
  };
};

/**
 * Middleware to check if user is author or admin (can create posts)
 */
export const checkAuthorOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  if (!user) {
    throw new ForBiddenError("Authentication required");
  }

  if (user.role !== "author" && user.role !== "admin") {
    throw new ForBiddenError("author or Admin access required");
  }

  next();
};
