import { Request, Response, NextFunction } from "express";
import { Types, Document } from "mongoose";
import AccessService from "../services/access.service.js";
import { OK, CREATED, SuccessResponse } from "../core/success.response.js";

interface SignUpBody {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

interface UserInfo {
  _id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
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

interface AuthenticatedRequest {
  refreshToken: string;
  user: UserInfo;
  keyStore: KeyStoreDocument;
}

class AccessController {
  signUp = async (
    req: Request<{}, {}, SignUpBody>,
    res: Response,
  ): Promise<void> => {
    new CREATED({
      message: "Registered OK!",
      metadata: await AccessService.signUp(req.body),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    new SuccessResponse({
      metadata: await AccessService.login(req.body),
    }).send(res);
  };

  handleRefreshToken = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    new SuccessResponse({
      message: "Get token success!",
      metadata: await AccessService.handlerRefreshToken({
        refreshToken: req.refreshToken!,
        user: req.user!,
        keyStore: req.keyStore!,
      }),
    }).send(res);
  };

  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    new SuccessResponse({
      message: "Logout success!",
      metadata: await AccessService.logout(req.keyStore!),
    }).send(res);
  };

  // me = async (
  //   req: KeyStoreDocument,
  //   res: Response,
  //   next: NextFunction,
  // ): Promise<void> => {
  //   new SuccessResponse({
  //     message: "Get info success!",
  //     metadata: await AccessService.me(req.userId),
  //   });
  // };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    new SuccessResponse({
      message: "Verify email processed",
      metadata: await AccessService.verifyEmail(token),
    }).send(res);
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    new SuccessResponse({
      message: "Forgot password request processed",
      metadata: await AccessService.forgotPassword(email),
    }).send(res);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;
    new SuccessResponse({
      message: "Password reset processed",
      metadata: await AccessService.resetPassword(token, newPassword),
    }).send(res);
  };
}

export default new AccessController();