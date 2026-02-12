import { Types } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { commentModel } from "../models/comment.model.js";
import { likeModel } from "../models/like.model.js";
import { postModel } from "../models/post.model.js";

interface likeParams {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
}

class LikeService {
  static likePost = async (likeParams: likeParams) => {
    const post = await postModel.findById(likeParams.targetId);
    if (!post) throw new BadRequestError("Post not found!");

    const existingLike = await likeModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "post",
    });

    if (existingLike) {
      throw new BadRequestError("Already like post");
    } else {
      const createLikeRecord = await likeModel.create({
        userId: likeParams.userId,
        targetId: likeParams.targetId,
        targetType: "post",
      });
      if (!createLikeRecord)
        throw new BadRequestError("Create like record failed!");
      else {
        const result = await postModel.findByIdAndUpdate(likeParams.targetId, {
          $inc: { likesCount: 1 },
        });
        if (!result) throw new BadRequestError("Like failed!");
      }
    }
  };

  static unLikePost = async (likeParams: likeParams) => {
    const post = await postModel.findById(likeParams.targetId);
    if (!post) throw new BadRequestError("Post not found!");

    const existingLike = await likeModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "post",
    });

    if (!existingLike) {
      throw new BadRequestError("Like not found");
    } else {
      const deleteLikeRecord = await likeModel.deleteOne({
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
    const result = await likeModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "post",
    });
    return !!result;
  };

  static getPostLikesCount = async (likeParams: likeParams) => {
    const result = await likeModel.countDocuments({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "post",
    });
    return result;
  };

  static likeComment = async (likeParams: likeParams) => {
    const comment = await commentModel.findById(likeParams.targetId);
    if (!comment) throw new BadRequestError("Comment not found!");

    const existingLike = await likeModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "comment",
    });

    if (existingLike) {
      throw new BadRequestError("Already like comment");
    } else {
      const createLikeRecord = await likeModel.create({
        userId: likeParams.userId,
        targetId: likeParams.targetId,
        targetType: "comment",
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

    const existingLike = await likeModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "comment",
    });

    if (!existingLike) {
      throw new BadRequestError("Like not found");
    } else {
      const deleteLikeRecord = await likeModel.deleteOne({
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
    const result = await likeModel.findOne({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "comment",
    });
    return !!result;
  };

  static getCommentLikesCount = async (likeParams: likeParams) => {
    const result = await likeModel.countDocuments({
      userId: likeParams.userId,
      targetId: likeParams.targetId,
      targetType: "comment",
    });
    return result;
  };
}

export default LikeService;
