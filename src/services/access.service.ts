import { userModel } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import KeyTokenService from "./keyToken.service.js";
import { createTokenPair } from "../auth/authUtils.js";
import { getInfoData } from "../utils/index.js";
import {
  BadRequestError,
  AuthFailureError,
  ForBiddenError,
} from "../core/error.response.js";
import { Types } from "mongoose";
import UserService from "./user.service.js";

interface SignUpParams {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

interface LoginParams {
  email: string;
  password: string;
  refreshToken?: string | null;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  _id: string;
  username?: string;
  email: string;
  fullName?: string;
}

interface KeyStoreDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  publicKey: string;
  privateKey: string;
  refreshToken: string;
  refreshTokensUsed: string[];
  updateOne: (update: any) => Promise<any>;
}

interface UserPayload {
  _id: Types.ObjectId | string;
  email: string;
  password: string;
  fullName: string;
}

interface RefreshTokenParams {
  refreshToken: string;
  user: UserPayload;
  keyStore: KeyStoreDocument;
}

class AccessService {
  static signUp = async ({
    username,
    email,
    password,
    fullName,
  }: SignUpParams): Promise<{
    code: number | string;
    message?: string;
    metadata?: object | null;
  }> => {
    const holderShop = await userModel.findOne({ email }).lean();

    if (holderShop) {
      throw new BadRequestError("Email already exists!");
    }

    const existingUser = await userModel.findOne({ username }).lean();
    if (existingUser) {
      throw new BadRequestError("Username already exists!");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      username,
      email,
      password: passwordHash,
      fullName,
    });

    if (newUser) {
      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "pkcs1",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs1",
          format: "pem",
        },
      });

      const tokens = await createTokenPair(
        {
          userId: newUser._id,
          email,
          role: newUser.role,
          tokenVersion: newUser.tokenVersion || 0,
        },
        publicKey,
        privateKey,
      );

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newUser._id as Types.ObjectId,
        publicKey,
        privateKey,
        refreshToken: tokens.refreshToken,
      });

      // Kiểm tra nếu tạo keyStore thất bại
      if (!keyStore) {
        return {
          code: "xxxx",
          message: "keyStore error",
        };
      }

      return {
        code: 201,
        metadata: {
          user: getInfoData({
            fields: ["_id", "username", "email", "fullName"],
            object: newUser,
          }),
          tokens,
        },
      };
    }
    return {
      code: 200,
      metadata: null,
    };
  };

  static login = async ({
    email,
    password,
  }: LoginParams): Promise<{ user: UserResponse; tokens: TokenPair }> => {
    const foundUser = await UserService.findUserByEmail({ email });
    if (!foundUser) throw new BadRequestError("User not registered!");

    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) throw new AuthFailureError("Authentication error");

    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
      },
    });

    const { _id: userId, role, tokenVersion } = foundUser;
    const tokens = await createTokenPair(
      { userId, email, role, tokenVersion: tokenVersion || 0 },
      publicKey,
      privateKey,
    );

    await KeyTokenService.createKeyToken({
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
      userId,
    });
    return {
      user: getInfoData({
        fields: ["_id", "username", "email", "fullName"],
        object: foundUser,
      }) as UserResponse,
      tokens,
    };
  };

  static handlerRefreshToken = async ({
    refreshToken,
    user,
    keyStore,
  }: RefreshTokenParams): Promise<{
    user: UserPayload;
    tokens: TokenPair;
  }> => {
    const { _id, email } = user;
    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(new Types.ObjectId(_id));
      throw new ForBiddenError("Something wrong happen! Pls re login");
    }

    if (keyStore.refreshToken !== refreshToken)
      throw new AuthFailureError("Shop not registered");

    const foundUser = await UserService.findUserByEmail({ email });
    if (!foundUser) throw new AuthFailureError("Shop not registered");

    // create 1 cap RT(Refresh token) va AT(Access token) moi
    const tokens = await createTokenPair(
      { _id, email },
      keyStore.publicKey,
      keyStore.privateKey,
    );

    // update token
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, // Da dc su dung de lay token moi roi
      },
    });

    return {
      user,
      tokens,
    };
  };

  static logout = async (
    keyStore: KeyStoreDocument,
  ): Promise<{ deletedCount: number }> => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    console.log({ delKey });
    return delKey;
  };
}

export default AccessService;
