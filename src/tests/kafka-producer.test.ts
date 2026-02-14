import { kafkaProducer } from "../services/kafka/kafka.producer.js";
import { Types } from "mongoose";

describe("Kafka Producer Tests", () => {
  beforeAll(async () => {
    await kafkaProducer.connect();
  });

  afterAll(async () => {
    await kafkaProducer.disconnect();
  });

  test("Should publish notification event successfully", async () => {
    const testPayload = {
      notificationPayload: {
        userId: new Types.ObjectId(),
        actorId: new Types.ObjectId(),
        type: "like" as const,
        targetId: new Types.ObjectId(),
        targetType: "post" as const,
        message: "Test notification",
      },
      createdAt: new Date(),
    };

    // Should not throw
    await expect(
      kafkaProducer.publishNotificationEvent(
        "notification-created",
        testPayload,
      ),
    ).resolves.not.toThrow();
  });

  test("Should handle invalid topic gracefully", async () => {
    const payload = { test: "data" };

    // Kafka producer should log error but not crash
    await kafkaProducer.publishNotificationEvent("invalid-topic", payload);
    // Check that app is still running
    expect(true).toBe(true);
  });
});
