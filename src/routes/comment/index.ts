import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import CommentController from "../../controllers/comment.controller.js";
import { validateCommentInput } from "../../middleware/validation.js";

const router = express.Router();

// Comment CRUD
router.post(
  "/",
  authentication,
  validateCommentInput,
  asyncHandler(CommentController.createComment),
);
router.get(
  "/:commentId",
  authentication,
  asyncHandler(CommentController.getCommentById),
);
router.put("/", authentication, asyncHandler(CommentController.editComment));
router.delete(
  "/",
  authentication,
  asyncHandler(CommentController.deleteCommentById),
);

// Comment interactions
router.post(
  "/:commentId/like",
  authentication,
  asyncHandler(CommentController.toggleLikeComment),
);
router.post(
  "/:commentId/report",
  authentication,
  asyncHandler(CommentController.reportComment),
);

export default router;
