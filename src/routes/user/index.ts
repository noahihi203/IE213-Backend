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
router.use(authentication);

// Public authenticated routes
router.get("/:userId", asyncHandler(userController.getUserProfile));

// User can update their own profile, or admin can update any
router.put(
  "/:userId",
  checkOwnershipOrAdmin("userId"),
  asyncHandler(userController.updateUserProfile),
);

// Admin-only routes
router.get("/users", checkAdmin, asyncHandler(userController.getAllUsers));
router.delete(
  "/:userId",
  checkAdmin,
  asyncHandler(userController.deleteUser),
);
router.put(
  "/:userId/role",
  checkAdmin,
  checkSuperAdminProtection,
  checkNotSelfDemotion,
  checkAdminToAdminPermission,
  checkMaximumAdmins,
  checkMinimumAdmins,
  asyncHandler(userController.changeUserRole),
);

export default router;
