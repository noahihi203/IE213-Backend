import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import UserService from "../services/user.service.js";
import CommentService from "../services/comment.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import { BadRequestError } from "../core/error.response.js";

class UserController {
  getUserProfile = async (req: Request, res: Response): Promise<void> => {
    new SuccessResponse({
      message: "Get user profile success!",
      metadata: await UserService.getUserById({
        _id: Array.isArray(req.params.userId)
          ? req.params.userId[0]
          : req.params.userId,
      }),
    }).send(res);
  };

  updateUserProfile = async (req: Request, res: Response): Promise<void> => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format");
    new SuccessResponse({
      message: "Update user profile success!",
      metadata: await UserService.updateProfile(req.body, req.user?.userId),
    }).send(res);
  };

  updateUserEmail = async (req: Request, res: Response): Promise<void> => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format");
    new SuccessResponse({
      message: "Update user email success!",
      metadata: await UserService.changeEmail(req.body, req.user?.userId),
    }).send(res);
  };

  updateUserUsername = async (req: Request, res: Response): Promise<void> => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format");

    const newUsername = req.body?.newUsername;
    if (typeof newUsername !== "string") {
      throw new BadRequestError("Invalid username format");
    }

    new SuccessResponse({
      message: "Update user username success!",
      metadata: await UserService.changeUserName(req.user.userId, newUsername),
    }).send(res);
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
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
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    new SuccessResponse({
      message: "Delete user success!",
      metadata: await UserService.deleteUserById(userId),
    }).send(res);
  };

  restoreUserById = async (req: Request, res: Response): Promise<void> => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    new SuccessResponse({
      message: "Restore user success!",
      metadata: await UserService.restoreUserById(userId),
    }).send(res);
  };

  changeUserRole = async (req: Request, res: Response): Promise<void> => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const { role } = req.body;

    new SuccessResponse({
      message: "Change user role success!",
      metadata: await UserService.updateUserRole({
        userId,
        newRole: role,
      }),
    }).send(res);
  };

  getUserComments = async (req: Request, res: Response): Promise<void> => {
    const { userId, skip, limit } = req.query;

    new SuccessResponse({
      message: "Get user comments success!",
      metadata: await CommentService.getUserComments({
        userId: convertToObjectIdMongodb(userId as string),
        skip: skip ? parseInt(skip as string) : 0,
        limit: limit ? parseInt(limit as string) : 10,
      }),
    }).send(res);
  };

  followUser = async (req: Request, res: Response): Promise<void> => {
    if (typeof req.user?.userId !== "string") {
      throw new BadRequestError("Invalid userId format");
    }

    const targetUserId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    new SuccessResponse({
      message: "Follow user success!",
      metadata: await UserService.followUser({
        userId: convertToObjectIdMongodb(targetUserId),
        followerId: convertToObjectIdMongodb(req.user.userId),
      }),
    }).send(res);
  };

  getMyFollowers = async (req: Request, res: Response): Promise<void> => {
    if (typeof req.user?.userId !== "string") {
      throw new BadRequestError("Invalid userId format");
    }

    const { page, limit, search } = req.query;

    new SuccessResponse({
      message: "Get followers success!",
      metadata: await UserService.getMyFollowers({
        userId: req.user.userId,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: (search as string) || "",
      }),
    }).send(res);
  };

  getMyFollowing = async (req: Request, res: Response): Promise<void> => {
    if (typeof req.user?.userId !== "string") {
      throw new BadRequestError("Invalid userId format");
    }

    const { page, limit, search } = req.query;

    new SuccessResponse({
      message: "Get following success!",
      metadata: await UserService.getMyFollowing({
        userId: req.user.userId,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: (search as string) || "",
      }),
    }).send(res);
  };
}

export default new UserController();
