import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import UploadService from "../services/upload.service.js";
import { BadRequestError } from "../core/error.response.js";

class UploadController {
  uploadImage = async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError("No file provided");

    new SuccessResponse({
      message: "Upload image success",
      metadata: await UploadService.uploadImage(req.file),
    }).send(res);
  };
}

export default new UploadController();