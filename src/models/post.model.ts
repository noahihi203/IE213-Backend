import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "Post";
const COLLECTION_NAME = "Posts";

export interface IPost {
  authorId: Schema.Types.ObjectId;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  status: "draft" | "published" | "archived";
  tags: Array<string>;
  category: Schema.Types.ObjectId;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  publishedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true },
    coverImage: { type: String, default: null },
    slug: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    viewCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null, index: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
  },
);

export const postModel = model<IPost>(DOCUMENT_NAME, postSchema);
