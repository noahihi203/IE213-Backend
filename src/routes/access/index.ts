import express from "express";
import accessController from "../../controllers/access.controller.js";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import {
  validateLoginInput,
  validateRegisterInput,
  validateVerifyEmailInput,
  validateForgotPasswordInput,
  validateResetPasswordInput
} from "../../middleware/validation.js";
const router = express.Router();

//signUp
router.post(
  "/register",
  validateRegisterInput,
  asyncHandler(accessController.signUp),
);
router.post("/login", validateLoginInput, asyncHandler(accessController.login));

// password recovery & verification routes
router.post("/verify-email", validateVerifyEmailInput, asyncHandler(accessController.verifyEmail));
router.post("/forgot-password", validateForgotPasswordInput, asyncHandler(accessController.forgotPassword));
router.post("/reset-password", validateResetPasswordInput, asyncHandler(accessController.resetPassword));

// authentication
router.post(
  "/refresh-token",
  authentication,
  asyncHandler(accessController.handleRefreshToken as any),
);

router.post(
  "/logout",
  authentication,
  asyncHandler(accessController.logout as any),
);

export default router;