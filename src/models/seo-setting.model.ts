import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "SeoSetting";
const COLLECTION_NAME = "SeoSettings";

export interface ISeoSetting {
  key: string;
  value: string;
}

const seoSettingSchema = new Schema<ISeoSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, default: "" },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
  },
);

export const seoSettingModel = model<ISeoSetting>(
  DOCUMENT_NAME,
  seoSettingSchema,
);
