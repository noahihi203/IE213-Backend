import { model, Schema, Types } from "mongoose";

const DOCUMENT_NAME = "Comment";
const COLLECTION_NAME = "Comments";

export interface IComment {
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  commentLeft: number;
  commentRight: number;
  parentId: Types.ObjectId;
  likesCount: number;
  isEdited: boolean;
  isDeleted: boolean;
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
    commentLeft: { type: Number, default: 0 },
    commentRight: { type: Number, default: 0 },

    parentId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Comment",
      index: true,
    },
    likesCount: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
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
