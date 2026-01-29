import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "Share";
const COLLECTION_NAME = "Shares";

const shareSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Post",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    platform: {
      type: String,
      enum: ["facebook", "twitter", "linkedin", "internal"],
      required: true,
    },
    message: { type: String, default: null },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
    },
  },
);

export const shareModel = model(DOCUMENT_NAME, shareSchema);
