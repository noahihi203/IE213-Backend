import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import RenderController from "../../controllers/render.controller.js";

const router = express.Router();

router.get("/sitemap.xml", asyncHandler(RenderController.getSitemapXml));
router.get(
  "/sitemap-index.xml",
  asyncHandler(RenderController.getSitemapIndexXml),
);
router.get("/robots.txt", asyncHandler(RenderController.getRobotsTxt));
router.get("/ssr/posts/:slug", asyncHandler(RenderController.renderPostSSR));
router.get("/blog/:slug", asyncHandler(RenderController.renderPostDynamic));

export default router;
