import express from "express";
import accessController from "../../controllers/access.controller.js";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
const router = express.Router();

//signUp
router.post("/register", asyncHandler(accessController.signUp));
router.post("/login", asyncHandler(accessController.login));

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
