import express from "express";
import userController from "../../controllers/user.controller.js";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import {
  checkAdmin,
  checkOwnershipOrAdmin,
} from "../../middleware/authorization.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authentication);

// Public authenticated routes
router.get("/users/:userId", asyncHandler(userController.getUserProfile));

// User can update their own profile, or admin can update any
router.put(
  "/users/:userId",
  checkOwnershipOrAdmin("userId"),
  asyncHandler(userController.updateUserProfile),
);

// Admin-only routes
router.get("/users", checkAdmin, asyncHandler(userController.getAllUsers));
router.delete(
  "/users/:userId",
  checkAdmin,
  asyncHandler(userController.deleteUser),
);
router.put(
  "/users/:userId/role",
  checkAdmin,
  asyncHandler(userController.changeUserRole),
);

export default router;
