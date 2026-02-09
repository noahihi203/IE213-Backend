import express from "express";
import CategoryController from "../../controllers/category.controller.js";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import { checkAdmin } from "../../middleware/authorization.js";

const router = express.Router();

// PUBLIC ROUTES - No authentication
router.get("/", asyncHandler(CategoryController.getAllCategories));
router.get("/slug/:slug", asyncHandler(CategoryController.getCategoryBySlug));
router.get("/:categoryId", asyncHandler(CategoryController.getSingleCategory));

// PROTECTED ROUTES - Require authentication
router.use(authentication); // Apply middleware to all routes below

router.post("/", checkAdmin, asyncHandler(CategoryController.createCategory));
router.put(
  "/:categoryId",
  checkAdmin,
  asyncHandler(CategoryController.updateCategory),
);  
router.delete(
  "/:categoryId",
  checkAdmin,
  asyncHandler(CategoryController.deleteCategory),
);

export default router;
