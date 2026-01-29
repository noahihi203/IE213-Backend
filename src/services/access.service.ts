import { userModel } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import KeyTokenService from "./keyToken.service.js";
import { createTokenPair } from "../auth/authUtils.js";
import { getInfoData } from "../utils/index.js";
import { BadRequestError } from "../core/error.response.js";
// import { findByEmail } from "./user.service.js";
import { Types } from "mongoose";

interface SignUpParams {
  username: string;
  email: string;
  password: string;
  fullName: string;
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
      throw new BadRequestError("Error: Shop already registered!");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      username,
      email,
      password: passwordHash,
      fullName,
    });

    if (newUser) {
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      console.log({ privateKey, publicKey });

      const tokens = await createTokenPair(
        { userId: newUser._id, email },
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

  // static login = async ({
  //   email,
  //   password,
  //   refreshToken = null,
  // }: LoginParams): Promise<{ shop: object; tokens: TokenPair }> => {
  //   const foundShop = await findByEmail({ email });
  //   if (!foundShop) throw new BadRequestError("Shop not registered!");

  //   //2
  //   const match = await bcrypt.compare(password, foundShop.password);
  //   if (!match) throw new AuthFailureError("Authentication error");

  //   //3
  //   const privateKey = crypto.randomBytes(64).toString("hex");
  //   const publicKey = crypto.randomBytes(64).toString("hex");

  //   const { _id: userId } = foundShop;
  //   //4
  //   const tokens = await createTokenPair(
  //     { userId, email },
  //     publicKey,
  //     privateKey,
  //   );

  //   await KeyTokenService.createKeyToken({
  //     refreshToken: tokens.refreshToken,
  //     privateKey,
  //     publicKey,
  //     userId,
  //   });
  //   //5
  //   return {
  //     shop: getInfoData({
  //       fields: ["_id", "name", "email"],
  //       object: foundShop,
  //     }),
  //     tokens,
  //   };
  // };

  // static handlerRefreshToken = async ({
  //   refreshToken,
  //   user,
  //   keyStore,
  // }: RefreshTokenParams): Promise<{
  //   user: UserPayload;
  //   tokens: TokenPair;
  // }> => {
  //   const { userId, email } = user;
  //   if (keyStore.refreshTokensUsed.includes(refreshToken)) {
  //     await KeyTokenService.deleteKeyById(userId);
  //     throw new ForBiddenError("Something wrong happen! Pls re login");
  //   }

  //   if (keyStore.refreshToken !== refreshToken)
  //     throw new AuthFailureError("Shop not registered");

  //   const foundShop = await findByEmail({ email });
  //   if (!foundShop) throw new AuthFailureError("Shop not registered");

  //   // create 1 cap RT(Refresh token) va AT(Access token) moi
  //   const tokens = await createTokenPair(
  //     { userId, email },
  //     keyStore.publicKey,
  //     keyStore.privateKey,
  //   );

  //   // update token
  //   await keyStore.updateOne({
  //     $set: {
  //       refreshToken: tokens.refreshToken,
  //     },
  //     $addToSet: {
  //       refreshTokensUsed: refreshToken, // Da dc su dung de lay token moi roi
  //     },
  //   });

  //   return {
  //     user,
  //     tokens,
  //   };
  // };

  // static logout = async (keyStore: KeyStoreDocument): Promise<any> => {
  //   const delKey = await KeyTokenService.removeKeyById(keyStore._id);
  //   console.log({ delKey });
  //   return delKey;
  // };
}

export default AccessService;
