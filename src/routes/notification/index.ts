import express from "express";
import { asyncHandler } from "../../auth/checkAuth.js";
import { authentication } from "../../auth/authUtils.js";
import NotificationController from "../../controllers/notification.controller.js";

const router = express.Router();

// Comment CRUD
router.get(
  "/",
  authentication,
  asyncHandler(NotificationController.getUserNotifications),
);
router.delete(
  "/read",
  authentication,
  asyncHandler(NotificationController.deleteAllRead),
);

router.put(
  "/read-all",
  authentication,
  asyncHandler(NotificationController.markAllAsRead),
);
router.delete(
  "/:notificationId",
  authentication,
  asyncHandler(NotificationController.deleteNotification),
);

router.put(
  "/:notificationId/read",
  authentication,
  asyncHandler(NotificationController.markAsRead),
);

export default router;
