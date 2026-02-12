import { model, Schema, Document, Types } from "mongoose";

const DOCUMENT_NAME = "User";
const COLLECTION_NAME = "Users";

export interface IUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar?: string | null;
  bio?: string | null;
  role: "admin" | "user" | "author";
  isSuperAdmin: boolean;
  tokenVersion: number;
  isActive: boolean;
  followers?: Types.ObjectId;
  following?: Types.ObjectId;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    avatar: { type: String, default: null },
    bio: { type: String, default: null },
    role: {
      type: String,
      enum: ["admin", "user", "author"],
      default: "user",
      index: true,
    },
    isSuperAdmin: { type: Boolean, default: false, index: true },
    tokenVersion: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    followers: { type: Schema.Types.ObjectId, ref: "User" },
    following: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
  },
);

export const userModel = model<IUser>(DOCUMENT_NAME, userSchema);
