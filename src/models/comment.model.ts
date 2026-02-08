import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "Comment";
const COLLECTION_NAME = "Comments";

interface IComment {
  postId: Schema.Types.ObjectId;
  authorId: Schema.Types.ObjectId;
  content: string;
  parentId: Schema.Types.ObjectId;
  likesCount: number;
  isEdited: boolean;
}

const commentSchema = new Schema<IComment>(
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

export const commentModel = model<IComment>(DOCUMENT_NAME, commentSchema);
