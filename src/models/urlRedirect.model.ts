import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "UrlRedirect";
const COLLECTION_NAME = "UrlRedirects";

export interface IUrlRedirect {
  fromPath: string;
  toUrl: string;
  statusCode: 301 | 302;
  isActive: boolean;
}

const urlRedirectSchema = new Schema<IUrlRedirect>(
  {
    fromPath: { type: String, required: true, unique: true, index: true },
    toUrl: { type: String, required: true },
    statusCode: { type: Number, enum: [301, 302], default: 301 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "modifiedOn",
    },
  },
);

export const urlRedirectModel = model<IUrlRedirect>(
  DOCUMENT_NAME,
  urlRedirectSchema,
);
