import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/spaces.config.js";
import { BadRequestError } from "../core/error.response.js";
import dotenv from "dotenv";

dotenv.config();

function safeFileName(name: string) {
  return name.replace(/[^\w.-]/g, "_");
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

class UploadService {
  static uploadImage = async (file: Express.Multer.File) => {
    if (!file) throw new BadRequestError("No file uploaded");

    const key = `uploads/posts/${Date.now()}-${safeFileName(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET,
      Key: key,
      Body: file.buffer,
      ACL: "public-read",
      ContentType: file.mimetype,
    });

    await s3.send(command);

    const imageUrl = joinUrl(process.env.SPACES_CDN as string, key);

    return {
      imageUrl,
    };
  };
}

export default UploadService;