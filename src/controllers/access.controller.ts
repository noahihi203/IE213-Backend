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

class AccessController {
  signUp = async (
    req: Request<{}, {}, SignUpBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    new CREATED({
      message: "Registered OK!",
      metadata: await AccessService.signUp(req.body),
      options: {
        limit: 10,
      },
    }).send(res);
  };

  // login = async (
  //   req: Request<{}, {}, LoginBody>,
  //   res: Response,
  //   next: NextFunction,
  // ): Promise<void> => {
  //   new SuccessResponse({
  //     metadata: await AccessService.login(req.body),
  //   }).send(res);
  // };

  // handleRefreshToken = async (
  //   req: AuthenticatedRequest,
  //   res: Response,
  //   next: NextFunction,
  // ): Promise<void> => {
  //   new SuccessResponse({
  //     message: "Get token success!",
  //     metadata: await AccessService.handlerRefreshToken({
  //       refreshToken: req.refreshToken!,
  //       user: req.user!,
  //       keyStore: req.keyStore!,
  //     }),
  //   }).send(res);
  // };

  // logout = async (
  //   req: AuthenticatedRequest,
  //   res: Response,
  //   next: NextFunction,
  // ): Promise<void> => {
  //   new SuccessResponse({
  //     message: "Logout success!",
  //     metadata: await AccessService.logout(req.keyStore!),
  //   }).send(res);
  // };

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
}

export default new AccessController();
