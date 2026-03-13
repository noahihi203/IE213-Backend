import { model, Schema, Types } from "mongoose";

const DOCUMENT_NAME = "LikePost";
const COLLECTION_NAME = "LikesPost";

export interface ILike {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
}

const likePostSchema = new Schema<ILike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
    },
  },
);

export const likePostModel = model<ILike>(DOCUMENT_NAME, likePostSchema);
