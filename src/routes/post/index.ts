import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import { checkAuthorOrAdmin } from "../../middleware/authorization.js";
import PostController from "../../controllers/post.controller.js";

const router = express.Router();

// PUBLIC ROUTES - No authentication
router.get("/trending", asyncHandler(PostController.getTrendingPosts));
router.get("/", asyncHandler(PostController.getAllPosts));
router.get("/:postId", asyncHandler(PostController.getSinglePost));
router.get("/slug/:slug", asyncHandler(PostController.getPostBySlug));

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

router.post(
  "/:postId/like",
  authentication,
  asyncHandler(PostController.likePost),
);

router.delete(
  "/:postId/like",
  authentication,
  asyncHandler(PostController.unlikePost),
);

router.post(
  "/:postId/share",
  authentication,
  asyncHandler(PostController.sharePost),
);

export default router;
