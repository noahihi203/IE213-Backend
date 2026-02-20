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
  checkOwnership,
  checkSuperAdminProtection,
} from "../../middleware/authorization.js";
import {
  validateUpdateUserEmailInput,
  validateUpdateUserInput,
  validateUpdateUsernameInput,
} from "../../middleware/validation.js";

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
  "/",
  validateUpdateUserInput,
  authentication,
  checkOwnership,
  asyncHandler(userController.updateUserProfile),
);

router.put(
  "/update-email",
  validateUpdateUserEmailInput,
  authentication,
  checkOwnership,
  asyncHandler(userController.updateUserEmail),
);

router.put(
  "/update-username",
  validateUpdateUsernameInput,
  authentication,
  checkOwnership,
  asyncHandler(userController.updateUserUsername),
);

// Admin-only routes
router.get(
  "/all",
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
router.get(
  "/comments",
  authentication,
  asyncHandler(userController.getUserComments),
);

export default router;
