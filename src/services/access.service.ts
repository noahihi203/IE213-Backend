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
import logger from "../config/logger.config.js";
import EmailService from "./email.service.js";

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
  role: "admin" | "author" | "user";
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
  }: SignUpParams) => {
    // validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError("Invalid email format");
    }
    if (username.length < 3 || username.length > 30) {
      throw new BadRequestError("Username must be between 3 and 30 characters");
    }
    // 4. Validate fullName if provided
    if (fullName && fullName.trim().length < 2) {
      throw new BadRequestError("Full name must be at least 2 characters");
    }

    //exist User?
    const holderShop = await userModel.findOne({ email }).lean();

    if (holderShop) {
      throw new BadRequestError("Email already exists!");
    }

    const existingUser = await userModel.findOne({ username }).lean();
    if (existingUser) {
      throw new BadRequestError("Username already exists!");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await userModel.create({
      username,
      email,
      password: passwordHash,
      fullName,
      emailVerificationToken: verificationToken,
      isEmailVerified: false,
    });
    await EmailService.sendVerificationEmail(email, verificationToken);

    // set super admin
    if (newUser) {
      const adminExists = await userModel.exists({
        isSuperAdmin: true,
      });

      if (!adminExists) {
        const updateSuperAdmin = await newUser.updateOne({
          isSuperAdmin: true,
          role: "admin",
        });
        logger.debug("Super Admin ID: ", newUser._id);
        if (!updateSuperAdmin) {
          throw new BadRequestError("Update Super Admin failed!");
        }
      }
    }

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
        message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
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
    const foundUser = await UserService.findUserByEmail({
      email,
      select: { email: 1, password: 1, fullName: 1, username: 1, role: 1, tokenVersion: 1, isEmailVerified: 1 }
    });
    
    if (!foundUser) throw new BadRequestError("User not registered!");
    if (foundUser.isEmailVerified === false) {
      throw new AuthFailureError("Vui lòng xác thực email trước khi đăng nhập!");
    }

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
        fields: ["_id", "username", "email", "fullName", "role"],
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
    logger.debug("delKey", { delKey });
    return delKey;
  };

  // ================= NEW AUTH METHODS =================

  static verifyEmail = async (token: string) => {
    const user = await userModel.findOne({ emailVerificationToken: token });
    if (!user) {
      throw new BadRequestError("Token xác thực không hợp lệ hoặc đã hết hạn.");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    return { message: "Xác thực email thành công!" };
  };

  static forgotPassword = async (email: string) => {
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError("Không tìm thấy tài khoản với email này.");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    await EmailService.sendPasswordResetEmail(email, resetToken);

    return { message: "Email đặt lại mật khẩu đã được gửi." };
  };

  static resetPassword = async (token: string, newPassword: string) => {
    const user = await userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }, // Check if token has expired
    });

    if (!user) {
      throw new BadRequestError("Token không hợp lệ hoặc đã hết hạn.");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return { message: "Đặt lại mật khẩu thành công!" };
  };
}

export default AccessService;