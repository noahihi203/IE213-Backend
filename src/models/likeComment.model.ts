import { model, Schema, Types } from "mongoose";

const DOCUMENT_NAME = "LikeComment";
const COLLECTION_NAME = "LikesComment";

export interface ILike {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
}

const likeCommentSchema = new Schema<ILike>(
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

export const likeCommentModel = model<ILike>(DOCUMENT_NAME, likeCommentSchema);
