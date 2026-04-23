import { model, Schema, Types } from "mongoose";

const DOCUMENT_NAME = "Post";
const COLLECTION_NAME = "Posts";

export interface IPost {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  status: "draft" | "published" | "archived";
  tags: Array<Types.ObjectId>;
  keyword?: string;
  category: Types.ObjectId;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  trendingScore: number;
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
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag", index: true }],
    keyword: { type: String, default: null, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    viewCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0, index: true },
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

postSchema.index({ status: 1, publishedAt: -1, createdOn: -1 });
postSchema.index({ category: 1, status: 1, publishedAt: -1, createdOn: -1 });
postSchema.index({ authorId: 1, status: 1, createdOn: -1 });
postSchema.index({ status: 1, trendingScore: -1 });

export const postModel = model<IPost>(DOCUMENT_NAME, postSchema);
