import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../core/error.response.js";

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new BadRequestError("Only JPEG, PNG, WebP, AVIF images are supported"),
      );
      return;
    }

    cb(null, true);
  },
}).single("image");

export const uploadSingleImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload(req, res, (error: unknown) => {
    if (error instanceof BadRequestError) {
      return next(error);
    }

    if (error) {
      return next(new BadRequestError("Invalid image upload payload"));
    }

    return next();
  });
};
