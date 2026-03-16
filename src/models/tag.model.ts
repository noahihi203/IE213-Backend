import { model, Schema, Types } from "mongoose";

const DOCUMENT_NAME = "Tag";
const COLLECTION_NAME = "Tags";

export interface ITag {
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  status: "active" | "inactive";
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    postCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  },
);

export const tagModel = model<ITag>(DOCUMENT_NAME, tagSchema);
