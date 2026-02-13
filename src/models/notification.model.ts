import { model, Schema, Types } from "mongoose";

const DOCUMENT_NAME = "Notification";
const COLLECTION_NAME = "Notifications";

export interface INotification {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "like" | "comment" | "share" | "follow" | "mention" | "newPost";
  targetId: Types.ObjectId;
  targetType: "post" | "comment" | "user";
  message: string;
  isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    actorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    type: {
      type: String,
      enum: ["like", "comment", "share", "follow", "mention", "newPost"],
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetType: {
      type: String,
      enum: ["post", "comment", "user"],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
    },
  },
);

export const notificationModel = model<INotification>(
  DOCUMENT_NAME,
  notificationSchema,
);
