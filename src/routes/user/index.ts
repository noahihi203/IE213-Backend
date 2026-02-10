import express from "express";
import userController from "../../controllers/user.controller.js";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import {
  checkAdmin,
  checkAdminToAdminPermission,
  checkMaximumAdmins,
  checkMinimumAdmins,
  checkNotSelfDemotion,
  checkOwnershipOrAdmin,
  checkSuperAdminProtection,
} from "../../middleware/authorization.js";

const router = express.Router();

// Apply authentication to all routes

// Public authenticated routes
router.get(
  "/:userId",
  authentication,
  asyncHandler(userController.getUserProfile),
);

// User can update their own profile, or admin can update any
router.put(
  "/:userId",
  authentication,
  checkOwnershipOrAdmin("userId"),
  asyncHandler(userController.updateUserProfile),
);

// Admin-only routes
router.get(
  "/users",
  authentication,
  checkAdmin,
  asyncHandler(userController.getAllUsers),
);
router.delete(
  "/:userId",
  authentication,
  checkAdmin,
  asyncHandler(userController.deleteUser),
);
router.put(
  "/:userId/role",
  authentication,
  checkAdmin,
  checkSuperAdminProtection,
  checkNotSelfDemotion,
  checkAdminToAdminPermission,
  checkMaximumAdmins,
  checkMinimumAdmins,
  asyncHandler(userController.changeUserRole),
);

export default router;
