import express from "express";
import accessController from "../../controllers/access.controller.js";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authenticationV2 } from "../../auth/authUtils.js";
const router = express.Router();

//signUp
router.post("/register", asyncHandler(accessController.signUp));
// router.post("/login", asyncHandler(accessController.login));

// // authentication
// router.use(authenticationV2);
// router.post("/logout", asyncHandler(accessController.logout));
// router.post("/me", asyncHandler(accessController.me));
// router.post(
//   "/refresh-token",
//   asyncHandler(accessController.handleRefreshToken),
// );

export default router;
