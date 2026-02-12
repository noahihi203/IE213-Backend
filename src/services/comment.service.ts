import { Types } from "mongoose";
import { commentModel } from "../models/comment.model.js";
import {
  BadRequestError,
  ForBiddenError,
  NotFoundError,
} from "../core/error.response.js";
import { postModel } from "../models/post.model.js";
import { likeModel } from "../models/like.model.js";

interface createCommentParams {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  parentCommentId?: Types.ObjectId;
}

interface deleteParams {
  commentId: Types.ObjectId;
  postId: Types.ObjectId;
}

interface updateParams {
  commentId: Types.ObjectId;
  userIdEdit: Types.ObjectId;
  content: string;
}

interface reportParams {
  commentId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: string;
}

interface IUserComments {
  userId: Types.ObjectId;
  skip: number;
  limit: number;
}

class CommentService {
  static createComment = async (createCommentParams: createCommentParams) => {
    const comment = new commentModel({
      postId: createCommentParams.postId,
      userId: createCommentParams.userId,
      content: createCommentParams.content,
      parentId: createCommentParams.parentCommentId,
    });

    let rightValue: number = 0;
    if (createCommentParams.parentCommentId) {
      //reply comment
      const parentComment = await commentModel.findById(
        createCommentParams.parentCommentId,
      );
      if (!parentComment) throw new NotFoundError(`Parent comment not found!`);

      await commentModel.updateMany(
        {
          postId: createCommentParams.postId,
          commentRight: {
            $gte: rightValue,
          },
        },
        { $inc: { commentRight: 2 } },
      );

      await commentModel.updateMany(
        {
          postId: createCommentParams.postId,
          commentLeft: {
            $gt: rightValue,
          },
        },
        { $inc: { commentLeft: 2 } },
      );
    } else {
      const maxRightValue = await commentModel.findOne(
        {
          userId: createCommentParams.userId,
        },
        "commentRight",
        { sort: { commentRight: -1 } },
      );
      if (maxRightValue) {
        rightValue = maxRightValue.commentRight + 1;
      } else {
        rightValue = 1;
      }
    }
    // insert
    comment.commentLeft = rightValue;
    comment.commentRight = rightValue + 1;

    await comment.save();
    return comment;
  };

  static getCommentByParentId = async (
    postId: Types.ObjectId,
    parentCommentId?: Types.ObjectId,
  ) => {
    if (parentCommentId) {
      const parent = await commentModel.findById(parentCommentId);
      if (!parent) throw new NotFoundError(`Not found comment for product!`);

      const comments = await commentModel
        .find({
          postId: postId,
          commentLeft: { $gt: parent.commentLeft },
          commentRight: { $lte: parent.commentRight },
        })
        .select({
          commentLeft: 1,
          commentRight: 1,
          content: 1,
          parentId: 1,
        })
        .sort({
          commentLeft: 1,
        });
      return comments;
    }

    const comments = await commentModel
      .find({
        postId: postId,
        parentId: parentCommentId,
      })
      .select({
        commentLeft: 1,
        commentRight: 1,
        content: 1,
        parentId: 1,
      })
      .sort({
        commentLeft: 1,
      });
    return comments;
  };

  static async deleteComments(deleteParams: deleteParams) {
    const { postId, commentId } = deleteParams;
    // check the product exists in database?
    const postFound = await postModel.findById(postId);
    if (!postFound) throw new NotFoundError(`Product not found!`);

    // 1. Xac dinh gia tri left and right of commentId
    const comment = await commentModel.findById(commentId);
    if (!comment) throw new NotFoundError(`Comment not found!`);

    const leftValue = comment.commentLeft;
    const rightValue = comment.commentRight;

    // 2. Calc width
    const width = rightValue - leftValue + 1;
    // 3.  Del all commentId child
    await commentModel.deleteMany({
      postId: postId,
      commentLeft: { $gte: leftValue, $lte: rightValue },
    });

    // 4. Update value of left and right
    await commentModel.updateMany(
      {
        postId: postId,
        commentRight: { $gt: rightValue },
      },
      {
        $inc: { commentRight: -width },
      },
    );

    await commentModel.updateMany(
      {
        postId: postId,
        commentLeft: { $gt: rightValue },
      },
      {
        $inc: { commentLeft: -width },
      },
    );

    return true;
  }

  // update content comment
  static async updateComment(updateParams: updateParams) {
    const { commentId, userIdEdit, content } = updateParams;

    const comment = await commentModel.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");

    if (comment.userId !== userIdEdit)
      throw new ForBiddenError("You can only edit your own comments");
    else {
      comment.content = content;
      comment.isEdited = true;
    }
    comment.save();

    return comment;
  }

  static async getCommentById(commentId: Types.ObjectId) {
    const comment = await commentModel.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");
    return comment;
  }

  static async getCommentCount(
    postId: Types.ObjectId,
    parentCommentId?: Types.ObjectId,
  ) {
    const post = await postModel.findById(postId);
    if (!post) throw new NotFoundError("Post not found");

    if (parentCommentId) {
      const parent = await commentModel.findById(parentCommentId);
      return await commentModel.countDocuments({
        postId: postId,
        commentLeft: { $gt: parent?.commentLeft },
        commentRight: { $lt: parent?.commentRight },
      });
    } else {
      return await commentModel.countDocuments({
        postId: postId,
      });
    }
  }

  static async toggleLikeComment(
    commentId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const comment = await commentModel.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");

    const like = await likeModel.findOne({
      targetId: commentId,
      userId: userId,
      targetType: "comment",
    });
    if (!like) {
      const newLike = await likeModel.create({
        userId: userId,
        targetId: commentId,
        targetType: "comment",
      });

      if (!newLike) throw new BadRequestError("Create like record error");
      else {
        comment.likesCount = comment.likesCount + 1;
        comment.save();
      }
      return {
        liked: true,
        likesCount: comment.likesCount,
      };
    } else {
      const deleteLikeRecord = await likeModel.deleteOne({
        userId: userId,
        targetId: commentId,
        targetType: "comment",
      });
      if (!deleteLikeRecord)
        throw new BadRequestError("Delete like record failed!");
      else {
        comment.likesCount = comment.likesCount - 1;
        comment.save();
      }
      return {
        liked: false,
        likesCount: comment.likesCount,
      };
    }
  }

  static async reportComment(
    commentId: Types.ObjectId,
    reportedBy: Types.ObjectId,
    reason: string,
  ) {
    const comment = await commentModel.findByIdAndUpdate(
      commentId,
      {
        $push: {
          reports: {
            reportedBy: reportedBy,
            reason: reason,
            createdAt: new Date(),
          },
        },
        $inc: { reportCount: 1 }, // Tăng reportCount lên 1
      },
      { new: true },
    );

    if (!comment) throw new NotFoundError("Comment not found!");

    return {
      message: "Report comment success!",
      reportCount: comment.reportCount,
    };
  }

  static async getUserComments(IUserComments: IUserComments) {
    const { userId, skip, limit } = IUserComments;
    const comments = await commentModel
      .find({ userId: userId })
      .populate("postId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (!comments) throw new NotFoundError("Comment by user not found!");

    return comments;
  }
}

export default CommentService;
