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
router.put(
  "/:notificationId/read",
  authentication,
  asyncHandler(NotificationController.markAsRead),
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
router.delete(
  "/read",
  authentication,
  asyncHandler(NotificationController.deleteAllRead),
);

export default router;
