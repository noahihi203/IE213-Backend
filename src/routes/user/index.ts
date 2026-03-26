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

// Admin-only routes
// MUST be defined BEFORE /:userId to prevent "all" being parsed as userId
router.get(
  "/all",
  authentication,
  checkAdmin,
  asyncHandler(userController.getAllUsers),
);

router.get(
  "/followers",
  authentication,
  asyncHandler(userController.getMyFollowers),
);

router.get(
  "/following",
  authentication,
  asyncHandler(userController.getMyFollowing),
);

router.post(
  "/:userId/follow",
  authentication,
  asyncHandler(userController.followUser),
);

router.post(
  "/:userId/unfollow",
  authentication,
  asyncHandler(userController.unfollowUser),
);

router.get(
  "/:userId/followers",
  authentication,
  asyncHandler(userController.getUserFollowers),
);

router.get(
  "/:userId/following",
  authentication,
  asyncHandler(userController.getUserFollowing),
);

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

router.delete(
  "/:userId",
  authentication,
  checkAdmin,
  asyncHandler(userController.deleteUser),
);

router.put(
  "/restore/:userId",
  authentication,
  checkAdmin,
  asyncHandler(userController.restoreUserById),
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
