import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import NotificationService from "../services/notification.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import { BadRequestError } from "../core/error.response.js";

class NotificationController {
  // GET /v1/api/notifications?isRead=false&type=like
  getUserNotifications = async (req: Request, res: Response) => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format!");

    // FIX: đọc filter từ req.query thay vì req.body
    const { isRead: isReadRaw, type } = req.query;

    // Parse isRead từ string query sang boolean
    let isRead: boolean | undefined;
    if (isReadRaw === "true") isRead = true;
    else if (isReadRaw === "false") isRead = false;
    // nếu không truyền → undefined → không filter theo isRead

    new SuccessResponse({
      message: "Get user notification success!",
      metadata: await NotificationService.getUserNotifications({
        userId: convertToObjectIdMongodb(req.user.userId),
        filter: {
          isRead,
          type: typeof type === "string" ? type : undefined,
        },
      }),
    }).send(res);
  };

  // PUT /v1/api/notifications/:notificationId/read
  markAsRead = async (req: Request, res: Response) => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format!");

    if (typeof req.params.notificationId !== "string")
      throw new BadRequestError("Invalid notificationId format!");

    new SuccessResponse({
      message: "Mark as read notification success!",
      metadata: await NotificationService.markAsRead({
        userId: convertToObjectIdMongodb(req.user.userId),
        notiId: convertToObjectIdMongodb(req.params.notificationId),
      }),
    }).send(res);
  };

  // PUT /v1/api/notifications/read-all
  markAllAsRead = async (req: Request, res: Response) => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format!");

    new SuccessResponse({
      message: "Mark all as read notification success!",
      metadata: await NotificationService.markAllAsRead(
        convertToObjectIdMongodb(req.user.userId),
      ),
    }).send(res);
  };

  // DELETE /v1/api/notifications/:notificationId
  deleteNotification = async (req: Request, res: Response) => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format!");

    if (typeof req.params.notificationId !== "string")
      throw new BadRequestError("Invalid notificationId format!");

    new SuccessResponse({
      message: "Delete notification success!",
      metadata: await NotificationService.deleteNotification(
        convertToObjectIdMongodb(req.params.notificationId),
        // FIX: truyền userId để service có thể check ownership
        convertToObjectIdMongodb(req.user.userId),
      ),
    }).send(res);
  };

  // DELETE /v1/api/notifications/read
  deleteAllRead = async (req: Request, res: Response) => {
    if (typeof req.user?.userId !== "string")
      throw new BadRequestError("Invalid userId format!");

    new SuccessResponse({
      message: "Delete all read notifications success!",
      metadata: await NotificationService.deleteAllRead(
        convertToObjectIdMongodb(req.user.userId),
      ),
    }).send(res);
  };
}

export default new NotificationController();
