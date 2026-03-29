import express from "express";
import multer from "multer";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import uploadController from "../../controllers/upload.controller.js";

const router = express.Router();

// Store file in memory to upload to Spaces directly
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  storage: multer.memoryStorage(),
});

// Protect the route so only authenticated users (authors/admins) can upload
router.post(
  "/image",
  authentication,
  upload.single("image"),
  asyncHandler(uploadController.uploadImage)
);

export default router;