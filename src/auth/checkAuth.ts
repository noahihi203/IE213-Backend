import { Request, Response, NextFunction, RequestHandler } from "express";
import apiKeyService from "../services/apikey.service.js";

interface CustomRequest extends Request {
  objKey?: {
    permissions: string[];
    [key: string]: any;
  };
}

const HEADER = {
  API_KEY: "x-api-key",
  AUTHORIZATION: "authorization",
} as const;

const apiKey = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const key = req.headers[HEADER.API_KEY]?.toString().trim();
    console.log("[1]:::key:", key);
    console.log(
      "[2]:::req.headers[HEADER.API_KEY]:",
      req.headers[HEADER.API_KEY],
    );
    if (!key) {
      return res.status(403).json({
        message: "Forbidden Error",
      });
    }
    // check objKey
    const objKey = await apiKeyService.findById(key);
    console.log("[3]:::objKey:", objKey);

    if (!objKey) {
      return res.status(403).json({
        message: "Forbidden Error",
      });
    }
    (req as any).objKey = objKey;
    return next();
  } catch (e) {
    next(e);
  }
};

const permission = (permissionName: string): RequestHandler => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.objKey?.permissions) {
      return res.status(403).json({
        message: "permission denied",
      });
    }

    console.log("permission::", req.objKey.permissions);
    const validPermission = req.objKey.permissions.includes(permissionName);
    if (!validPermission) {
      return res.status(403).json({
        message: "permission denied",
      });
    }
    return next();
  };
};

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export { asyncHandler, apiKey, permission };
