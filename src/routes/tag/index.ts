import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import { validateCreateTagInput } from "../../middleware/validation.js";
import TagController from "../../controllers/tag.controller.js";
import { checkAdmin } from "../../middleware/authorization.js";

const router = express.Router();

router.post(
  "/",
  authentication,
  validateCreateTagInput,
  asyncHandler(TagController.createTag),
);

router.get("/:tagId", asyncHandler(TagController.getTagById));

router.get("/", asyncHandler(TagController.getAllTag));

router.put("/", authentication, asyncHandler(TagController.updateTag));

router.put(
  "/active/:tagId",
  authentication,
  asyncHandler(TagController.updateStatusTagToActive),
);
router.put(
  "/inactive/:tagId",
  authentication,
  asyncHandler(TagController.updateStatusTagToInActive),
);

router.put(
  "/count",
  authentication,
  asyncHandler(TagController.updateTagCounts),
);

router.delete(
  "/:tagId",
  authentication,
  checkAdmin,
  asyncHandler(TagController.deleteTag),
);

export default router;
