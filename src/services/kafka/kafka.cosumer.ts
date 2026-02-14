import { Kafka, Consumer } from "kafkajs";
import { notificationModel } from "../../models/notification.model.js";
import { userModel } from "../../models/user.model.js";
import { postModel } from "../../models/post.model.js";
import { commentModel } from "../../models/comment.model.js";

export class KafkaConsumer {
  private consumer: Consumer;

  constructor() {
    const kafka = new Kafka({ brokers: ["localhost:9092"] });
    // GroupId giúp scale ngang: nhiều instance cùng groupId sẽ chia nhau xử lý message
    this.consumer = kafka.consumer({ groupId: "notification-group" });
  }

  async connect() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ["notification-created", "notification-batch"],
      fromBeginning: false,
    });

    await this.consumer.run({
      // Xử lý theo từng đợt để tối ưu performance (Batching)
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        const messages = [];

        for (const message of batch.messages) {
          if (message.value) {
            messages.push(JSON.parse(message.value.toString()));
          }
          // Đánh dấu message đã đọc
          resolveOffset(message.offset);
        }

        // Lưu hàng loạt vào MongoDB
        if (messages.length > 0) {
          await this.processAndSaveToDB(messages);
        }

        await heartbeat(); // Tránh bị Kafka coi là "dead"
      },
    });

    console.log("Kafka Consumer is running...");
  }

  private async processAndSaveToDB(notifications: any[]) {
    const validNotifications = [];

    for (const msg of notifications) {
      try {
        const { userId, actorId, targetId, targetType } =
          msg.notificationPayload;

        // Validate user
        const userExists = await userModel.exists({ _id: userId });
        if (!userExists) {
          console.warn(`Skip notification: user ${userId} not found`);
          continue;
        }

        // Validate actor
        const actorExists = await userModel.exists({ _id: actorId });
        if (!actorExists) {
          console.warn(`Skip notification: actor ${actorId} not found`);
          continue;
        }

        // Validate target based on type
        if (targetType === "post") {
          const targetExists = await postModel.exists({ _id: targetId });
          if (!targetExists) {
            console.warn(`Skip notification: post ${targetId} not found`);
            continue;
          }
        } else if (targetType === "comment") {
          const targetExists = await commentModel.exists({ _id: targetId });
          if (!targetExists) {
            console.warn(
              `Skip notification: comment ${targetId} not found`,
            );
            continue;
          }
        } else if (targetType === "user") {
          const targetExists = await userModel.exists({ _id: targetId });
          if (!targetExists) {
            console.warn(
              `Skip notification: target user ${targetId} not found`,
            );
            continue;
          }
        }

        validNotifications.push(msg.notificationPayload);
      } catch (error) {
        console.error(`Error processing notification:`, error);
        // Continue processing other notifications
      }
    }

    // Batch insert valid notifications
    if (validNotifications.length > 0) {
      try {
        const result = await notificationModel.insertMany(validNotifications, {
          ordered: false, // Continue on error
        });
        console.log(`Saved ${result.length} notifications to DB`);
      } catch (error) {
        console.error(`Failed to save notifications:`, error);
      }
    } else {
      console.log(`No valid notifications to save`);
    }
  }
}
