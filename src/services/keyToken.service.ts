import { keyTokenModel } from "../models/keytoken.model.js";

import { Types } from "mongoose";

interface CreateKeyTokenParams {
  userId: Types.ObjectId;
  publicKey: string;
  privateKey: string;
  refreshToken: string | string[];
}

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken,
  }: CreateKeyTokenParams) => {
    try {
      const filter = { user: userId },
        update = { publicKey, privateKey, refreshTokensUsed: [], refreshToken },
        options = { upsert: true, new: true };
      const tokens = await keyTokenModel.findOneAndUpdate(
        filter,
        update,
        options,
      );

      return tokens ? tokens.publicKey : null;
    } catch (error) {
      return error;
    }
  };

  static findByUserId = async (userId: string) => {
    return await keyTokenModel.findOne({ user: new Types.ObjectId(userId) });
  };

  static removeKeyById = async (id: Types.ObjectId) => {
    return await keyTokenModel.deleteOne({ _id: id });
  };

  static findByRefreshTokenUsed = async (refreshToken: string) => {
    return await keyTokenModel
      .findOne({ refreshTokensUsed: refreshToken })
      .lean();
  };

  static findByRefreshToken = async (refreshToken: string) => {
    return await keyTokenModel.findOne({ refreshToken });
  };

  static deleteKeyById = async (userId: Types.ObjectId) => {
    return await keyTokenModel.deleteOne({
      user: new Types.ObjectId(userId),
    });
  };
}

export default KeyTokenService;
