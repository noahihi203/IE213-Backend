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
import { withPublicCache } from "../../middleware/cache-control.js";
import { uploadSingleImage } from "../../middleware/upload-image.js";

const router = express.Router();

// PUBLIC ROUTES - No authentication
router.get(
  "/trending",
  withPublicCache(60, 120),
  asyncHandler(PostController.getTrendingPosts),
);
router.get(
  "/slug/:slug",
  withPublicCache(60, 120),
  asyncHandler(PostController.getPostBySlug),
);
router.get(
  "/",
  withPublicCache(30, 60),
  asyncHandler(PostController.getAllPosts),
);

router.post(
  "/images/optimize",
  authentication,
  uploadSingleImage,
  asyncHandler(PostController.optimizeCoverImage),
);

// PROTECTED READ ROUTES
router.get(
  "/my-posts",
  authentication,
  asyncHandler(PostController.getMyPosts),
);

router.get(
  "/my-liked-posts",
  authentication,
  asyncHandler(PostController.getLikedMyPosts),
);

router.get(
  "/:postId/is-liked",
  authentication,
  asyncHandler(PostController.isPostLikedByUser),
);

// PUBLIC ROUTES WITH PATH PARAMS
router.get(
  "/:postId",
  withPublicCache(60, 120),
  asyncHandler(PostController.getSinglePost),
);

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

router.patch(
  "/:postId/status",
  authentication,
  checkAuthorOrAdmin,
  checkPostOwnership,
  asyncHandler(PostController.changePostStatus),
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
  "/:postId/comments",
  withPublicCache(20, 40),
  asyncHandler(PostController.getPostComments),
);

router.get(
  "/:postId/next-comments",
  withPublicCache(20, 40),
  asyncHandler(PostController.getNextLevelPostComments),
);

router.get(
  "/:postId/comment-count",
  withPublicCache(20, 40),
  asyncHandler(PostController.getCommentCount),
);

export default router;
