import { BadRequestError } from "../core/error.response.js";
import { SuccessResponse } from "../core/success.response.js";
import CommentService from "../services/comment.service.js";
import { Request, Response } from "express";
import { convertToObjectIdMongodb } from "../utils/index.js";

class CommentController {
  createComment = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (typeof postId !== "string")
      throw new BadRequestError("Invalid postId format");

    const userId = req.user?.userId;
    if (typeof userId !== "string")
      throw new BadRequestError("Invalid userId format");
    new SuccessResponse({
      message: "Create comment success!",
      metadata: await CommentService.createComment({
        postId: convertToObjectIdMongodb(postId),
        userId: convertToObjectIdMongodb(userId),
        content: req.body.content,
        parentCommentId: req.body.parentCommentId,
      }),
    }).send(res);
  };

  getPostComments = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (typeof postId !== "string")
      throw new BadRequestError("Invalid postId format");

    new SuccessResponse({
      message: "Get post comments success!",
      metadata: await CommentService.getCommentByParentId(
        convertToObjectIdMongodb(postId),
        req.body.parentCommentId,
      ),
    }).send(res);
  };

  deleteCommentById = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Delete comment success!",
      metadata: await CommentService.deleteComments(req.body),
    }).send(res);
  };

  editComment = async (req: Request, res: Response) => {
    const commentId = req.body.commentId;
    if (typeof commentId !== "string")
      throw new BadRequestError("Invalid commentId format");

    const userId = req.user?.userId;
    if (typeof userId !== "string")
      throw new BadRequestError("Invalid userId format");
    new SuccessResponse({
      message: "Update comment success!",
      metadata: await CommentService.updateComment({
        commentId: convertToObjectIdMongodb(commentId),
        userIdEdit: convertToObjectIdMongodb(userId),
        content: req.body.content,
      }),
    }).send(res);
  };
}

export default new CommentController();
