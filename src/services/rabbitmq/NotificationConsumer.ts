import logger from "../../config/logger.config.js";
import { notificationModel } from "../../models/notification.model.js";
import { RabbitMQConsumer } from "../rabbitmq/rabbitmq.consumer.js";

export class NotificationConsumer extends RabbitMQConsumer {
  async start() {
    await this.connect();
    await this.subscribe("notification-queue", this.handleNotification);
    logger.info(
      "🔔 NotificationConsumer started, listening to notification-queue",
    );
  }

  private handleNotification = async (payload: any) => {
    const { notificationPayload } = payload;

    if (!notificationPayload) {
      logger.error("Invalid payload received:", payload);
      return;
    }

    await notificationModel.create({
      userId: notificationPayload.userId,
      actorId: notificationPayload.actorId,
      type: notificationPayload.type,
      targetId: notificationPayload.targetId,
      targetType: notificationPayload.targetType,
      message: notificationPayload.message,
      isRead: false,
    });

    logger.info(
      `Notification saved — type: ${notificationPayload.type}, user: ${notificationPayload.userId}`,
    );
  };
}

