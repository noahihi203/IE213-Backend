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

router.get(
  "/:postId/is-liked",
  authentication,
  asyncHandler(PostController.isPostLikedByUser),
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

router.patch(
  "/:postId/publish",
  authentication,
  checkAuthorOrAdmin,
  checkPostOwnership,
  asyncHandler(PostController.publishPost),
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

router.get("/:postId/comments", asyncHandler(PostController.getPostComments));

router.get("/:postId/next-comments", asyncHandler(PostController.getNextLevelPostComments));

router.get(
  "/:postId/comment-count",
  asyncHandler(PostController.getCommentCount),
);

export default router;
