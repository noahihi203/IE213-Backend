import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "Like";
const COLLECTION_NAME = "Likes";

interface ILike {
  userId: Schema.Types.ObjectId;
  targetId: Schema.Types.ObjectId;
  targetType: "post" | "comment";
}

const likeSchema = new Schema<ILike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
      index: true,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
    },
  },
);

export const likeModel = model<ILike>(DOCUMENT_NAME, likeSchema);
