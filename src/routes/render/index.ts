import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import RenderController from "../../controllers/render.controller.js";

const router = express.Router();

router.get("/ssr/posts/:slug", asyncHandler(RenderController.renderPostSSR));
router.get("/blog/:slug", asyncHandler(RenderController.renderPostDynamic));

export default router;
