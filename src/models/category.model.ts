import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "Category";
const COLLECTION_NAME = "Categories";

export interface ICategory {
  name: string;
  abbreviation: string;
  slug: string;
  description: string;
  icon: string;
  postCount: number;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, index: true },
    abbreviation: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: null },
    icon: { type: String, default: null },
    postCount: { type: Number, default: 0 },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
  },
);

export const categoryModel = model<ICategory>(DOCUMENT_NAME, categorySchema);
