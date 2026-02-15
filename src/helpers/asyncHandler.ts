import { Request, Response, NextFunction } from "express";

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> => {
    await fn(req, res, next)?.catch(next);
  };
};

export default asyncHandler;
