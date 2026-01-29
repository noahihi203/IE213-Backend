import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "Comment";
const COLLECTION_NAME = "Comments";

const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Post",
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    content: { type: String, required: true },
    parentId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Comment",
      index: true,
    },
    likesCount: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
  },
);

export const commentModel = model(DOCUMENT_NAME, commentSchema);
