import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import {
  checkAuthorOrAdmin,
  checkPostOwnership,
} from "../../middleware/authorization.js";
import PostController from "../../controllers/post.controller.js";
import {
  validatePostInput,
  validateUpdatePostInput,
} from "../../middleware/validation.js";

const router = express.Router();

// PUBLIC ROUTES - No authentication
router.get("/trending", asyncHandler(PostController.getTrendingPosts));
router.get("/slug/:slug", asyncHandler(PostController.getPostBySlug));
router.get("/", asyncHandler(PostController.getAllPosts));

// PROTECTED READ ROUTES
router.get(
  "/my-posts",
  authentication,
  asyncHandler(PostController.getMyPosts),
);

// PUBLIC ROUTES WITH PATH PARAMS
router.get("/:postId", asyncHandler(PostController.getSinglePost));

// PROTECTED ROUTES - Require authentication
router.post(
  "/",
  validatePostInput,
  authentication,
  checkAuthorOrAdmin,
  asyncHandler(PostController.createPost),
);

router.put(
  "/:postId",
  validateUpdatePostInput,
  authentication,
  checkPostOwnership,
  checkAuthorOrAdmin,
  asyncHandler(PostController.updatePost),
);

router.delete(
  "/:postId",
  authentication,
  checkAuthorOrAdmin,
  checkPostOwnership,
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

router.get(
  "/comments",
  authentication,
  asyncHandler(PostController.getPostComments),
);

router.get(
  "/comment-count",
  authentication,
  asyncHandler(PostController.getCommentCount),
);

export default router;
