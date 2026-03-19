import { Request, Response, NextFunction } from "express";
import { SuccessResponse } from "../core/success.response.js";
import UserService from "../services/user.service.js";
import CommentService from "../services/comment.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import { BadRequestError } from "../core/error.response.js";

class UserController {
  getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      new SuccessResponse({
        message: "Get user profile success!",
        metadata: await UserService.getUserById({
          _id: Array.isArray(req.params.userId)
            ? req.params.userId[0]
            : req.params.userId,
        }),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) throw new BadRequestError("User ID is missing from request");
      
      // Safely convert to string in case it's an ObjectId
      const userId = req.user.userId.toString();

      new SuccessResponse({
        message: "Update user profile success!",
        metadata: await UserService.updateProfile(req.body, userId),
      }).send(res);
    } catch (error) {
      next(error); // Prevents the request from hanging
    }
  };

  updateUserEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) throw new BadRequestError("User ID is missing from request");
      
      const userId = req.user.userId.toString();

      new SuccessResponse({
        message: "Update user email success!",
        metadata: await UserService.changeEmail(req.body, userId),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  updateUserUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) throw new BadRequestError("User ID is missing from request");
      
      const userId = req.user.userId.toString();

      new SuccessResponse({
        message: "Update user username success!",
        metadata: await UserService.changeUserName(userId, req.body.newUsername),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  updateUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) throw new BadRequestError("User ID is missing from request");
      
      const userId = req.user.userId.toString();
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new BadRequestError("Current password and new password are required");
      }

      new SuccessResponse({
        message: "Password updated successfully!",
        metadata: await UserService.updatePassword(userId, currentPassword, newPassword),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, role, isActive } = req.query;

      new SuccessResponse({
        message: "Get all users success!",
        metadata: await UserService.getAllUsersWithPagination({
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          search: search as string,
          role: role as string,
          isActive:
            isActive === "true" ? true : isActive === "false" ? false : undefined,
        }),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;

      new SuccessResponse({
        message: "Delete user success!",
        metadata: await UserService.deleteUserById(userId),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  restoreUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;

      new SuccessResponse({
        message: "Restore user success!",
        metadata: await UserService.restoreUserById(userId),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
      const { role } = req.body;

      new SuccessResponse({
        message: "Change user role success!",
        metadata: await UserService.updateUserRole({ userId, newRole: role }),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  getUserComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, skip, limit } = req.query;

      new SuccessResponse({
        message: "Get user comments success!",
        metadata: await CommentService.getUserComments({
          userId: convertToObjectIdMongodb(userId as string),
          skip: skip ? parseInt(skip as string) : 0,
          limit: limit ? parseInt(limit as string) : 10,
        }),
      }).send(res);
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();