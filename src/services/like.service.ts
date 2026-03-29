import { Types } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { commentModel } from "../models/comment.model.js";
import { likeCommentModel } from "../models/likeComment.model.js";
import { likePostModel } from "../models/likePost.model.js";
import { postModel } from "../models/post.model.js";
import NotificationService from "./notification.service.js";

interface likeParams {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
}

class LikeService {
  static likePost = async (likeParams: likeParams) => {
    const post = await postModel.findById(likeParams.targetId);
    if (!post) throw new BadRequestError("Post not found!");

    const existingLike = await likePostModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });

    if (existingLike) {
      throw new BadRequestError("Already like post");
    } else {
      const createLikeRecord = await likePostModel.create({
        userId: likeParams.userId,
        targetId: likeParams.targetId,
      });
      if (!createLikeRecord)
        throw new BadRequestError("Create like record failed!");
      else {
        const result = await postModel.findByIdAndUpdate(likeParams.targetId, {
          $inc: { likesCount: 1 },
        });
        if (!result) throw new BadRequestError("Like failed!")
        else {
          await NotificationService.notifyOnPost({
            postId: result._id,
            actorId: likeParams.userId,
            type: "like",
            message: "like your post",
          });
        }
      }
    }
  };

  static unLikePost = async (likeParams: likeParams) => {
    const post = await postModel.findById(likeParams.targetId);
    if (!post) throw new BadRequestError("Post not found!");

    const existingLike = await likePostModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });

    if (!existingLike) {
      throw new BadRequestError("Like not found");
    } else {
      const deleteLikeRecord = await likePostModel.deleteOne({
        userId: likeParams.userId,
        targetId: likeParams.targetId,
      });
      if (!deleteLikeRecord)
        throw new BadRequestError("Delete like record failed!");
      else {
        const result = await postModel.findByIdAndUpdate(likeParams.targetId, {
          $inc: { likesCount: -1 },
        });
        if (!result) throw new BadRequestError("UnLike failed!");
      }
    }
  };

  static isPostLikeByUser = async (likeParams: likeParams) => {
    const result = await likePostModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });
    return !!result;
  };

  static getPostLikesCount = async (likeParams: likeParams) => {
    const result = await likePostModel.countDocuments({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });
    return result;
  };

  static likeComment = async (likeParams: likeParams) => {
    const comment = await commentModel.findById(likeParams.targetId);
    if (!comment) throw new BadRequestError("Comment not found!");

    const existingLike = await likeCommentModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });

    if (existingLike) {
      throw new BadRequestError("Already like comment");
    } else {
      const createLikeRecord = await likeCommentModel.create({
        userId: likeParams.userId,
        targetId: likeParams.targetId,
      });
      if (!createLikeRecord)
        throw new BadRequestError("Create like record failed!");
      else {
        const result = await commentModel.findByIdAndUpdate(
          likeParams.targetId,
          {
            $inc: { likeCount: 1 },
          },
        );
        if (!result) throw new BadRequestError("Like failed!");
      }
    }
  };

  static unLikeComment = async (likeParams: likeParams) => {
    const comment = await commentModel.findById(likeParams.targetId);
    if (!comment) throw new BadRequestError("Comment not found!");

    const existingLike = await likeCommentModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });

    if (!existingLike) {
      throw new BadRequestError("Like not found");
    } else {
      const deleteLikeRecord = await likeCommentModel.deleteOne({
        userId: likeParams.userId,
        targetId: likeParams.targetId,
      });
      if (!deleteLikeRecord)
        throw new BadRequestError("Delete like record failed!");
      else {
        const result = await commentModel.findByIdAndUpdate(
          likeParams.targetId,
          {
            $inc: { likeCount: -1 },
          },
        );
        if (!result) throw new BadRequestError("UnLike failed!");
      }
    }
  };

  static isCommentLikedByUser = async (likeParams: likeParams) => {
    const result = await likeCommentModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });
    return !!result;
  };

  static getCommentLikesCount = async (likeParams: likeParams) => {
    const result = await likeCommentModel.countDocuments({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
    });
    return result;
  };
}

export default LikeService;
