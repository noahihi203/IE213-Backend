import { Schema, Types, model } from "mongoose";

const DOCUMENT_NAME = "Key";
const COLLECTION_NAME = "Keys";

export interface IKeyToken {
  user: Types.ObjectId;
  privateKey: string;
  publicKey: string;
  refreshTokensUsed: Array<string>;
  refreshToken: string;
}

var keyTokenSchema = new Schema<IKeyToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    privateKey: {
      type: String,
      required: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    refreshTokensUsed: {
      type: [String],
      default: [], // Nhung RT da dc su dung
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  },
);

export const keyTokenModel = model<IKeyToken>(DOCUMENT_NAME, keyTokenSchema);
