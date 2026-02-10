import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import { checkAuthorOrAdmin } from "../../middleware/authorization.js";
import PostController from "../../controllers/post.controller.js";

const router = express.Router();

// PUBLIC ROUTES - No authentication
router.get("/", asyncHandler(PostController.getAllPosts));
router.get("/:postId", asyncHandler(PostController.getSinglePost));
router.get("/:slug", asyncHandler(PostController.getPostBySlug));

// PROTECTED ROUTES - Require authentication
router.post(
  "/",
  authentication,
  checkAuthorOrAdmin,
  asyncHandler(PostController.createPost),
);

router.put(
  "/:postId",
  authentication,
  checkAuthorOrAdmin,
  asyncHandler(PostController.updatePost),
);

router.delete(
  "/:postId",
  authentication,
  checkAuthorOrAdmin,
  asyncHandler(PostController.deletePost),
);

export default router;
