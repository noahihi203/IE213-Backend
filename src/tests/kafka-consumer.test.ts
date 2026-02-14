import { KafkaConsumer } from "../services/kafka/kafka.cosumer.js";
import { notificationModel } from "../models/notification.model.js";
import { kafkaProducer } from "../services/kafka/kafka.producer.js";
import mongoose, { Types } from "mongoose";
import "../dbs/init.mongodb.js"; // Auto-connects

describe("Kafka Consumer Tests", () => {
  let consumer: KafkaConsumer;

  beforeAll(async () => {
    // Wait for MongoDB connection
    while (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Start consumer
    consumer = new KafkaConsumer();
    await consumer.connect();

    // Clear test notifications
    await notificationModel.deleteMany({
      message: { $regex: /^TEST_/ },
    });
  });

  afterAll(async () => {
    await consumer.disconnect();
  });

  test("Should consume message and save to MongoDB", async () => {
    // Arrange: Publish a test message
    const testPayload = {
      notificationPayload: {
        userId: new Types.ObjectId(),
        actorId: new Types.ObjectId(),
        type: "like" as const,
        targetId: new Types.ObjectId(),
        targetType: "post" as const,
        message: "TEST_CONSUMER_" + Date.now(),
      },
      createdAt: new Date(),
    };

    await kafkaProducer.publishNotificationEvent(
      "notification-created",
      testPayload,
    );

    // Wait for consumer to process (async)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Assert: Check if notification saved in DB
    const savedNotification = await notificationModel.findOne({
      message: testPayload.notificationPayload.message,
    });

    expect(savedNotification).not.toBeNull();
    expect(savedNotification?.type).toBe("like");
    expect(savedNotification?.targetType).toBe("post");
  });

  test("Should handle batch processing", async () => {
    // Send multiple messages
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const payload = {
        notificationPayload: {
          userId: new Types.ObjectId(),
          actorId: new Types.ObjectId(),
          type: "comment" as const,
          targetId: new Types.ObjectId(),
          targetType: "post" as const,
          message: `TEST_BATCH_${Date.now()}_${i}`,
        },
        createdAt: new Date(),
      };
      promises.push(
        kafkaProducer.publishNotificationEvent("notification-created", payload),
      );
    }

    await Promise.all(promises);

    // Wait for batch processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if all saved
    const count = await notificationModel.countDocuments({
      message: { $regex: /^TEST_BATCH_/ },
    });

    expect(count).toBeGreaterThanOrEqual(5);
  });
});
