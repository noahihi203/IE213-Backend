import express from "express";
import CategoryController from "../../controllers/category.controller.js";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import {
  checkAdmin,
  checkCommentOwnership,
} from "../../middleware/authorization.js";
import postController from "../../controllers/post.controller.js";

const router = express.Router();

// PUBLIC ROUTES - No authentication
router.get("/", asyncHandler(CategoryController.getAllCategories));
router.get("/slug/:slug", asyncHandler(CategoryController.getCategoryBySlug));
router.get(
  "/featured-categories",
  asyncHandler(CategoryController.getFeaturedCategories),
);
router.get("/:categoryId", asyncHandler(CategoryController.getSingleCategory));
router.get(
  "/posts/:catSlug",
  asyncHandler(postController.getPostsByCategorySlug),
);
// PROTECTED ROUTES - Require authentication
router.post(
  "/",
  authentication,
  checkAdmin,
  asyncHandler(CategoryController.createCategory),
);
router.put(
  "/:categoryId",
  authentication,
  checkAdmin,
  asyncHandler(CategoryController.updateCategory),
);
router.delete(
  "/:categoryId",
  authentication,
  checkAdmin,
  asyncHandler(CategoryController.deleteCategory),
);

export default router;
