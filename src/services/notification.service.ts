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
import { rabbitMQProducer } from "./rabbitmq/rabbitmq.producer.js";
import logger from "../config/logger.config.js";

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
    isRead?: boolean;
    type?: string;
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
  type: "like" | "mention";
  message: string;
}

interface notifyOnUserPayload {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "follow" | "newPost";
  message: string;
  targetType?: "post" | "user";
  targetId?: Types.ObjectId;
}

class NotificationService {
  // Chỉ validate rồi đẩy lên queue — KHÔNG lưu DB ở đây
  // Việc lưu DB do NotificationConsumer xử lý
  static createNotification = async (
    notificationPayload: notificationPayload,
  ) => {
    const { userId, actorId, targetId, targetType } = notificationPayload;

    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const actor = await userModel.findById(actorId);
    if (!actor) throw new NotFoundError("Actor not found");

    if (targetType === "post") {
      const targetPost = await postModel.findById(targetId);
      if (!targetPost) throw new NotFoundError("Post not found");
    } else if (targetType === "comment") {
      const targetComment = await commentModel.findById(targetId);
      if (!targetComment) throw new NotFoundError("Comment not found");
    } else if (targetType === "user") {
      const targetUser = await userModel.findById(targetId);
      if (!targetUser) throw new NotFoundError("User not found");
    }

    const sent = await rabbitMQProducer.send("notification-queue", {
      notificationPayload,
      createdAt: new Date(),
    });

    if (!sent) {
      logger.warn(`Failed to enqueue notification for user ${userId}`);
    }

    return { success: true, message: "Notification is being processed" };
  };

  static getUserNotifications = async (payload: getUserNotisPayload) => {
    const { userId, filter } = payload;
    const { isRead, type } = filter;

    const query: Record<string, unknown> = { userId };

    if (isRead !== undefined) query.isRead = isRead;
    if (type && type !== "") query.type = type;

    const notifications = await notificationModel
      .find(query)
      .populate("actorId", "_id username fullName")
      .sort({ createdOn: -1 })
      .limit(20)
      .lean();

    const total = await notificationModel.countDocuments({ userId });

    const unreadCount = await notificationModel.countDocuments({
      userId,
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

    const notification = await notificationModel.findById(notiId).lean();
    if (!notification) throw new NotFoundError("Notification not found!");
    if (notification.userId.toString() !== userId.toString())
      throw new ForBiddenError("Không có quyền thao tác thông báo này!");

    const updateNoti = await notificationModel
      .findByIdAndUpdate(notiId, { isRead: true }, { new: true })
      .lean();

    return {
      updated: true,
      updateNoti,
    };
  };

  static markAllAsRead = async (userId: Types.ObjectId) => {
    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError("User not found!");

    const result = await notificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );

    return {
      updated: true,
      updatedCount: result.modifiedCount,
    };
  };

  static deleteNotification = async (
    notiId: Types.ObjectId,
    userId: Types.ObjectId,
  ) => {
    const notification = await notificationModel.findById(notiId).lean();
    if (!notification) throw new NotFoundError("Notification not found!");
    if (notification.userId.toString() !== userId.toString())
      throw new ForBiddenError("Không có quyền xóa thông báo này!");

    const deleteNoti = await notificationModel.findByIdAndDelete(notiId);
    if (!deleteNoti) throw new ForBiddenError("Delete noti failed!");

    return { deleted: true };
  };

  static deleteAllRead = async (userId: Types.ObjectId) => {
    const deleteNotis = await notificationModel.deleteMany({
      userId,
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
    if (!post) throw new NotFoundError("Post not found");

    const userId = post.authorId;
    if (!userId) throw new ForBiddenError("Post has no author!");

    if (userId.toString() === actorId.toString()) return;

    const noti = await NotificationService.createNotification({
      userId: convertToObjectIdMongodb(userId.toString()),
      actorId,
      message,
      type,
      targetType: "post",
      targetId: postId,
    });

    if (!noti) throw new BadRequestError("create noti post failed");
    return { createdNoti: true };
  };

  static notifyOnComment = async (payload: notifyOnCommentPayload) => {
    const { commentId, actorId, type, message } = payload;

    if (!commentId || !actorId || !type)
      throw new BadRequestError("Missing parameter");

    const comment = await commentModel.findById(commentId);
    if (!comment) throw new NotFoundError("Comment not found");

    const userId = comment.userId;
    if (!userId) throw new ForBiddenError("Comment has no user!");

    if (userId.toString() === actorId.toString()) return;

    const noti = await NotificationService.createNotification({
      userId: convertToObjectIdMongodb(userId.toString()),
      actorId,
      message,
      type,
      targetType: "comment",
      targetId: commentId,
    });

    if (!noti) throw new BadRequestError("create noti comment failed");
    return { createdNoti: true };
  };

  static notifyOnUser = async (payload: notifyOnUserPayload) => {
    const { userId, actorId, type, message, targetType, targetId } = payload;

    if (!userId || !actorId || !type)
      throw new BadRequestError("Missing parameter");

    if (userId.toString() === actorId.toString()) return;

    const resolvedTargetType = targetType || "user";
    const resolvedTargetId = targetId || actorId;

    const noti = await NotificationService.createNotification({
      userId: convertToObjectIdMongodb(userId.toString()),
      actorId,
      message,
      type,
      targetType: resolvedTargetType,
      targetId: resolvedTargetId,
    });

    if (!noti) throw new BadRequestError("create noti user failed");
    return { createdNoti: true };
  };
}

export default NotificationService;
