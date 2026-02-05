import { Request, Response, NextFunction } from "express";
import { ForBiddenError } from "../core/error.response.js";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role?: string;
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
 * Middleware to check if user is poster or admin (can create posts)
 */
export const checkPosterOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  if (!user) {                                                      
    throw new ForBiddenError("Authentication required");
  }

  if (user.role !== "poster" && user.role !== "admin") {
    throw new ForBiddenError("Poster or Admin access required");
  }

  next();
};
