import { model, Schema } from "mongoose";

const DOCUMENT_NAME = "ApiKey";
const COLLECTION_NAME = "ApiKeys";

interface IApiKey {
  key: string;
  status: boolean;
  permissions: "0000" | "1111" | "2222";
}

const apiKeySchema = new Schema<IApiKey>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    permissions: {
      type: String,
      required: true,
      enum: ["0000", "1111", "2222"],
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

export const apiKeyModel = model<IApiKey>(DOCUMENT_NAME, apiKeySchema);
