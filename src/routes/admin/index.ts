import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import StatisticsController from "../../controllers/statistics.controller.js";
import { checkAdmin } from "../../middleware/authorization.js";

const router = express.Router();

// PUBLIC ROUTES - No authentication
router.get(
  "/stats/dashboard",
  authentication,
  checkAdmin,
  asyncHandler(StatisticsController.getDashboardStats),
);
router.get(
  "/stats/users",
  authentication,
  checkAdmin,
  asyncHandler(StatisticsController.getUserStats),
);
router.get(
  "/stats/posts",
  authentication,
  checkAdmin,
  asyncHandler(StatisticsController.getPostStats),
);
router.get(
  "/stats/activity",
  authentication,
  checkAdmin,
  asyncHandler(StatisticsController.getActivityStats),
);
router.get(
  "/stats/categories",
  authentication,
  checkAdmin,
  asyncHandler(StatisticsController.getCategoryStats),
);

export default router;
