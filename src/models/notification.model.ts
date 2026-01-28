import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "Notification";
const COLLECTION_NAME = "Notifications";

const notificationSchema = new Schema(
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
      enum: ["like", "comment", "share", "follow", "mention"],
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

export const notification = model(DOCUMENT_NAME, notificationSchema);
