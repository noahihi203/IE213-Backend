import request from "supertest";
import app from "../app.js";
import { notificationModel } from "../models/notification.model.js";
import { userModel } from "../models/user.model.js";
import { postModel } from "../models/post.model.js";
import mongoose, { Types } from "mongoose";
import "../dbs/init.mongodb.js"; // Auto-connects

describe("Notification E2E Tests", () => {
  let testUser: any;
  let testActor: any;
  let testPost: any;
  let authToken: string;

  beforeAll(async () => {
    // Wait for MongoDB connection
    while (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Create test users
    testUser = await userModel.create({
      username: "testuser_" + Date.now(),
      email: `testuser_${Date.now()}@test.com`,
      password: "password123",
    });

    testActor = await userModel.create({
      username: "testactor_" + Date.now(),
      email: `testactor_${Date.now()}@test.com`,
      password: "password123",
    });

    // Create test post
    testPost = await postModel.create({
      title: "Test Post",
      content: "Test content",
      authorId: testUser._id,
    });

    // Login to get token
    const loginResponse = await request(app).post("/v1/api/login").send({
      email: testActor.email,
      password: "password123",
    });

    authToken = loginResponse.body.metadata.tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await userModel.deleteMany({
      username: { $regex: /^test(user|actor)_/ },
    });
    await postModel.deleteMany({ title: "Test Post" });
    await notificationModel.deleteMany({
      userId: testUser._id,
    });
  });

  test("Should create notification when liking a post", async () => {
    // Act: Like the post (triggers notification)
    const response = await request(app)
      .post(`/v1/api/posts/${testPost._id}/like`)
      .set("Authorization", `Bearer ${authToken}`)
      .set("x-client-id", testActor._id.toString());

    // Assert API response
    expect(response.status).toBe(200);

    // Wait for Kafka consumer to process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check notification created in DB
    const notification = await notificationModel.findOne({
      userId: testUser._id,
      actorId: testActor._id,
      targetId: testPost._id,
      type: "like",
    });

    expect(notification).not.toBeNull();
    expect(notification?.targetType).toBe("post");
    expect(notification?.isRead).toBe(false);
  });

  test("Should retrieve user notifications", async () => {
    // Create some test notifications via Kafka
    const notifyResponse = await request(app)
      .post(`/v1/api/notifications/create`)
      .set("Authorization", `Bearer ${authToken}`)
      .set("x-client-id", testActor._id.toString())
      .send({
        userId: testUser._id,
        actorId: testActor._id,
        type: "follow",
        targetId: testActor._id,
        targetType: "user",
        message: "followed you",
      });

    expect(notifyResponse.status).toBe(201);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get notifications
    const getResponse = await request(app)
      .get("/v1/api/notifications")
      .set("Authorization", `Bearer ${authToken}`)
      .set("x-client-id", testUser._id.toString());

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.metadata.notifications).toBeInstanceOf(Array);
    expect(getResponse.body.metadata.unreadCount).toBeGreaterThan(0);
  });

  test("Should mark notification as read", async () => {
    // Get a notification
    const notifications = await notificationModel.find({
      userId: testUser._id,
      isRead: false,
    });

    if (notifications.length === 0) {
      throw new Error("No unread notifications to test");
    }

    const notiId = notifications[0]._id;

    // Mark as read
    const response = await request(app)
      .patch(`/v1/api/notifications/${notiId}/read`)
      .set("Authorization", `Bearer ${authToken}`)
      .set("x-client-id", testUser._id.toString());

    expect(response.status).toBe(200);
    expect(response.body.metadata.updated).toBe(true);

    // Verify in DB
    const updatedNoti = await notificationModel.findById(notiId);
    expect(updatedNoti?.isRead).toBe(true);
  });
});
