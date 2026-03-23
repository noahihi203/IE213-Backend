import { Types } from "mongoose";
import { commentModel } from "../models/comment.model.js";
import {
  BadRequestError,
  ForBiddenError,
  NotFoundError,
} from "../core/error.response.js";
import { postModel } from "../models/post.model.js";
import { likeCommentModel } from "../models/likeComment.model.js";
import NotificationService from "./notification.service.js";
import PostService from "./post.service.js";

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

interface IUserComments {
  userId: Types.ObjectId;
  skip: number;
  limit: number;
}

class CommentService {
  private static readonly commentAuthorSelect = "username fullName avatar";

  static createComment = async (createCommentParams: createCommentParams) => {
    const comment = new commentModel({
      postId: createCommentParams.postId,
      userId: createCommentParams.userId,
      content: createCommentParams.content,
      parentId: createCommentParams.parentCommentId,
    });

    let rightValue = 0;
    if (createCommentParams.parentCommentId) {
      //reply comment
      const parentComment = await commentModel.findById(
        createCommentParams.parentCommentId,
      );
      if (!parentComment) throw new NotFoundError(`Parent comment not found!`);

      rightValue = parentComment.commentRight;

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

      await NotificationService.notifyOnComment({
        commentId: parentComment._id,
        actorId: comment.userId,
        type: "mention",
        message: "reply you in comment",
      });
    } else {
      const maxRightValue = await commentModel.findOne(
        {
          postId: createCommentParams.postId,
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
    await NotificationService.notifyOnPost({
      postId: comment.postId,
      actorId: comment.userId,
      type: "comment",
      message: "comment your post",
    });

    const totalComments = await commentModel.countDocuments({
      postId: comment.postId,
    });
    await PostService.updatePostCommentCount(comment.postId, totalComments);

    return comment;
  };

  // post use
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
          userId: 1,
          commentLeft: 1,
          commentRight: 1,
          content: 1,
          parentId: 1,
          likesCount: 1,
          isEdited: 1,
          createdOn: 1,
        })
        .sort({
          commentLeft: 1,
        })
        .populate("userId", CommentService.commentAuthorSelect)
        .lean();
      return comments;
    }

    const comments = await commentModel
      .find({
        postId: postId,
      })
      .select({
        userId: 1,
        commentLeft: 1,
        commentRight: 1,
        content: 1,
        parentId: 1,
        likesCount: 1,
        isEdited: 1,
        createdOn: 1,
      })
      .sort({
        commentLeft: 1,
      })
      .populate("userId", CommentService.commentAuthorSelect)
      .lean();
    return comments;
  };

  static getTopLevelComments = async (
    postId: Types.ObjectId,
    { limit = 5, skip = 0 }: { limit?: number; skip?: number },
  ) => {
    // Comment gốc = không có parentId
    const comments = await commentModel
      .find({
        postId,
        parentId: null,
      })
      .select({
        userId: 1,
        commentLeft: 1,
        commentRight: 1,
        content: 1,
        parentId: 1,
        likesCount: 1,
        isEdited: 1,
        createdOn: 1,
      })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", CommentService.commentAuthorSelect)
      .lean();

    // Đếm số reply của mỗi comment để hiện "Xem 3 phản hồi"
    const withReplyCount = await Promise.all(
      comments.map(async (c) => {
        const replyCount = await commentModel.countDocuments({
          postId,
          commentLeft: { $gt: c.commentLeft },
          commentRight: { $lt: c.commentRight },
        });
        return { ...c, replyCount };
      }),
    );

    const total = await commentModel.countDocuments({ postId, parentId: null });

    return {
      comments: withReplyCount,
      total,
      hasMore: skip + limit < total,
    };
  };

  static getRepliesByCommentId = async (
    postId: Types.ObjectId,
    parentCommentId: Types.ObjectId,
  ) => {
    const parent = await commentModel.findById(parentCommentId).lean();
    if (!parent) throw new NotFoundError("Comment not found!");

    // Chỉ lấy direct children (level 2), không lấy sâu hơn
    const replies = await commentModel
      .find({
        postId,
        parentId: parentCommentId,
      })
      .select({
        userId: 1,
        commentLeft: 1,
        commentRight: 1,
        content: 1,
        parentId: 1,
        likesCount: 1,
        isEdited: 1,
        createdOn: 1,
      })
      .sort({ commentLeft: 1 })
      .populate("userId", CommentService.commentAuthorSelect)
      .lean();

    return replies;
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
    const totalComments = await commentModel.countDocuments({ postId: postId });
    await PostService.updatePostCommentCount(postId, totalComments);
    return true;
  }

  // update content comment
  static async updateComment(updateParams: updateParams) {
    const { commentId, userIdEdit, content } = updateParams;

    const comment = await commentModel.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");

    if (comment.userId.toString() !== userIdEdit.toString())
      throw new ForBiddenError("You can only edit your own comments");
    else {
      comment.content = content;
      comment.isEdited = true;
    }
    await comment.save();

    return comment;
  }

  static async getCommentById(commentId: Types.ObjectId) {
    const comment = await commentModel.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");
    return comment;
  }

  // post use
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

    const like = await likeCommentModel.findOne({
      targetId: commentId,
      userId: userId,
    });
    if (!like) {
      const newLike = await likeCommentModel.create({
        userId: userId,
        targetId: commentId,
      });

      if (!newLike) throw new BadRequestError("Create like record error");
      else {
        comment.likesCount = comment.likesCount + 1;
        await comment.save();
      }
      await NotificationService.notifyOnComment({
        commentId: comment._id,
        actorId: userId,
        type: "like",
        message: "like your comment",
      });
      return {
        liked: true,
        likesCount: comment.likesCount,
      };
    } else {
      const deleteLikeRecord = await likeCommentModel.deleteOne({
        userId: userId,
        targetId: commentId,
      });
      if (!deleteLikeRecord.deletedCount)
        throw new BadRequestError("Delete like record failed!");
      else {
        comment.likesCount = Math.max(0, comment.likesCount - 1);
        await comment.save();
      }
      await NotificationService.notifyOnComment({
        commentId: comment._id,
        actorId: userId,
        type: "like",
        message: "unlike your comment",
      });
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

  //user use
  static async getUserComments(IUserComments: IUserComments) {
    const { userId, skip, limit } = IUserComments;
    const comments = await commentModel
      .find({ userId: userId })
      .populate("postId", "title")
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);
    if (!comments) throw new NotFoundError("Comment by user not found!");

    return comments;
  }
}

export default CommentService;
