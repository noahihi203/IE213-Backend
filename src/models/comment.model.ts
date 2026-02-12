import { model, Schema, Types } from "mongoose";

const DOCUMENT_NAME = "Comment";
const COLLECTION_NAME = "Comments";

export interface IComment {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  commentLeft: number;
  commentRight: number;
  parentId: Types.ObjectId;
  likesCount: number;
  reports: [
    {
      reportedBy: Types.ObjectId;
      reason: string;
      createdAt: Date;
    },
  ];
  reportCount: number;
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
    userId: {
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

    reports: [
      {
        reportedBy: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "User",
        },
        reason: {
          type: String,
          enum: ["spam", "harassment", "misinformation", "offensive", "other"],
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    reportCount: {
      type: Number,
      default: 0,
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
