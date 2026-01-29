import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "User";
const COLLECTION_NAME = "Users";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, hashed: true },
    fullName: { type: String, required: true },
    avatar: { type: String, default: null },
    bio: { type: String, default: null },
    role: {
      type: String,
      enum: ["admin", "user", "poster"],
      default: "user",
      index: true,
    },
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

export const userModel = model(DOCUMENT_NAME, userSchema);
