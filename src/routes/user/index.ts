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

// Public authenticated routes
router.get(
  "/:userId",
  authentication,
  asyncHandler(userController.getUserProfile),
);

// --- SELF-SERVICE USER UPDATE ROUTES ---
// We do not need checkOwnership here because the controller 
// forces the update to strictly use req.user.userId from the token.

router.put(
  "/",
  validateUpdateUserInput,
  authentication,
  asyncHandler(userController.updateUserProfile),
);

router.put(
  "/update-email",
  validateUpdateUserEmailInput,
  authentication,
  asyncHandler(userController.updateUserEmail),
);

router.put(
  "/update-username",
  validateUpdateUsernameInput,
  authentication,
  asyncHandler(userController.updateUserUsername),
);

// NEW: Added the password update route we created earlier!
router.put(
  "/update-password",
  authentication,
  asyncHandler(userController.updateUserPassword),
);

// --- ADMIN ROUTES ---

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