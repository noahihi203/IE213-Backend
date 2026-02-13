import { Types } from "mongoose";
import { notificationModel } from "../models/notification.model.js";
import { userModel } from "../models/user.model.js";
import {
  BadRequestError,
  ForBiddenError,
  NotFoundError,
} from "../core/error.response.js";
import { postModel } from "../models/post.model.js";
import { commentModel } from "../models/comment.model.js";
import { convertToObjectIdMongodb } from "../utils/index.js";

interface notificationPayload {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "like" | "comment" | "share" | "follow" | "mention" | "newPost";
  targetId: Types.ObjectId;
  targetType: "post" | "comment" | "user";
  message: string;
}

interface getUserNotisPayload {
  userId: Types.ObjectId;
  filter: {
    isRead: boolean | false;
    type: string | "";
  };
}

interface markAsReadPayload {
  userId: Types.ObjectId;
  notiId: Types.ObjectId;
}

interface notifyOnPostPayload {
  postId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "like" | "comment" | "share";
  message: string;
}

interface notifyOnCommentPayload {
  commentId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "like";
  message: string;
}

interface notifyOnUserPayload {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "follow" | "newPost" | "mention";
  message: string;
}

class NotificationService {
  static createNotification = async (
    notificationPayload: notificationPayload,
  ) => {
    const { userId, actorId, targetId, targetType } = notificationPayload;

    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const actor = await userModel.findById(actorId);
    if (!actor) throw new NotFoundError("Actor not found");

    if (targetType === "post") {
      // Ai đó thích bài viết của bản thân, người khác bình luận vào post của bản thân
      const targetPost = await postModel.findById(targetId);
      if (!targetPost) throw new NotFoundError("Post not found");
    } else if (targetType === "comment") {
      // Người khác nhắc tới mình trong một comment, người khác like comment của bản thân
      const targetPost = await commentModel.findById(targetId);
      if (!targetPost) throw new NotFoundError("Post not found");
    } else if (targetType === "user") {
      // Có người theo dõi bạn, admin khóa tài khoản...
      const targetPost = await userModel.findById(targetId);
      if (!targetPost) throw new NotFoundError("Post not found");
    }

    const noti = notificationModel.create(notificationPayload);

    if (!noti) throw new ForBiddenError("Create notification error!");

    return noti;
  };

  static getUserNotifications = async (payload: getUserNotisPayload) => {
    const { userId, filter } = payload;
    const { isRead, type } = filter;

    const query: any = { userId: userId };

    if (!isRead !== undefined) query.isRead = isRead;
    if (type && type !== "") query.type = type;
    const notifications = notificationModel
      .find(query)
      .populate("actorId", "_id username")
      .sort({ createdOn: -1 })
      .limit(20)
      .lean();
    const total = await notificationModel.countDocuments({
      userId: userId,
    });

    const unreadCount = await notificationModel.countDocuments({
      userId: userId,
      isRead: false,
    });
    return {
      notifications,
      total,
      unreadCount,
    };
  };

  static markAsRead = async (payload: markAsReadPayload) => {
    const { userId, notiId } = payload;

    if (!userId || !notiId) throw new ForBiddenError("Missing parameter!");

    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const updateNoti = await notificationModel
      .findByIdAndUpdate(notiId, {
        isRead: true,
      })
      .lean();

    if (!updateNoti)
      throw new NotFoundError(
        "Notification not found, update notification failed!",
      );

    return {
      updated: true,
      updateNoti: updateNoti,
    };
  };

  static markAllAsRead = async (userId: Types.ObjectId) => {
    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError("User not found!");

    const result = await notificationModel.updateMany(
      { userId: userId, isRead: false },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return {
      updated: true,
      updatedCount: result.modifiedCount,
    };
  };

  static deleteNotification = async (notiId: Types.ObjectId) => {
    const deleteNoti = await notificationModel.findByIdAndDelete(notiId);
    if (!deleteNoti) throw new ForBiddenError("Delete noti failed!");
    return {
      deleted: true,
    };
  };

  static deleteAllRead = async (userId: Types.ObjectId) => {
    const deleteNotis = await notificationModel.deleteMany({
      userId: userId,
      isRead: true,
    });
    if (!deleteNotis) throw new ForBiddenError("Delete notis failed!");
    return {
      deleted: true,
      deletedCount: deleteNotis.deletedCount,
    };
  };

  static notifyOnPost = async (payload: notifyOnPostPayload) => {
    const { postId, actorId, type, message } = payload;

    if (!postId || !actorId || !type)
      throw new BadRequestError("Missing parameter");

    const post = await postModel.findById(postId);
    const userId = post?.authorId;

    if (typeof userId !== "string")
      throw new ForBiddenError("Invalid userId format!");

    if (userId === actorId) return;

    const noti = await NotificationService.createNotification({
      userId: convertToObjectIdMongodb(userId),
      actorId,
      message,
      type,
      targetType: "post",
      targetId: postId,
    });

    if (!noti) throw new BadRequestError("create noti post failed");
    return {
      createdNoti: true,
    };
  };

  static notifyOnComment = async (payload: notifyOnCommentPayload) => {
    const { commentId, actorId, type, message } = payload;

    if (!commentId || !actorId || !type)
      throw new BadRequestError("Missing parameter");

    const comment = await commentModel.findById(commentId);
    const userId = comment?.userId;

    if (typeof userId !== "string")
      throw new ForBiddenError("Invalid userId format!");

    if (userId === actorId) return;

    const noti = await NotificationService.createNotification({
      userId: convertToObjectIdMongodb(userId),
      actorId,
      message,
      type,
      targetType: "comment",
      targetId: commentId,
    });

    if (!noti) throw new BadRequestError("create noti comment failed");
    return {
      createdNoti: true,
    };
  };

  static notifyOnUser = async (payload: notifyOnUserPayload) => {
    const { userId, actorId, type, message } = payload;

    if (!userId || !actorId || !type)
      throw new BadRequestError("Missing parameter");

    if (typeof userId !== "string")
      throw new ForBiddenError("Invalid userId format!");
    if (userId === actorId) return;

    const noti = await NotificationService.createNotification({
      userId: convertToObjectIdMongodb(userId),
      actorId,
      message,
      type,
      targetType: "user",
      targetId: actorId,
    });

    if (!noti) throw new BadRequestError("create noti post failed");
    return {
      createdNoti: true,
    };
  };
}

export default NotificationService;
