import request from "supertest";
import { app } from "../app.js";
import { userModel } from "../models/user.model.js";
import { keyTokenModel } from "../models/keytoken.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

describe("User Routes Integration Tests", () => {
  // Test data storage
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let regularToken: string;
  let adminKeyPair: { publicKey: string; privateKey: string };
  let regularKeyPair: { publicKey: string; privateKey: string };

  // Helper function to generate RSA key pair
  const generateKeyPair = () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
      },
    });
    return { publicKey, privateKey };
  };

  // Helper function to create JWT token
  const createToken = (
    payload: any,
    privateKey: string,
    expiresIn: string = "2 days",
  ) => {
    return jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn,
    });
  };

  // Setup: Create test users before all tests
  beforeAll(async () => {
    // Clean up existing test data
    await userModel.deleteMany({
      email: { $in: ["admin@test.com", "user@test.com"] },
    });
    await keyTokenModel.deleteMany({});

    // Generate key pairs
    adminKeyPair = generateKeyPair();
    regularKeyPair = generateKeyPair();

    // Create admin user
    adminUser = await userModel.create({
      username: "admin_test",
      email: "admin@test.com",
      password: "$2b$10$abcdefghijklmnopqrstuvwxyz123456", // Pre-hashed password
      fullName: "Admin Test User",
      role: "admin",
      tokenVersion: 0,
      isActive: true,
    });

    // Create regular user
    regularUser = await userModel.create({
      username: "user_test",
      email: "user@test.com",
      password: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
      fullName: "Regular Test User",
      role: "user",
      tokenVersion: 0,
      isActive: true,
    });

    // Create key tokens
    await keyTokenModel.create({
      user: adminUser._id,
      publicKey: adminKeyPair.publicKey,
      privateKey: adminKeyPair.privateKey,
      refreshToken: "dummy_refresh_token_admin",
      refreshTokensUsed: [],
    });

    await keyTokenModel.create({
      user: regularUser._id,
      publicKey: regularKeyPair.publicKey,
      privateKey: regularKeyPair.privateKey,
      refreshToken: "dummy_refresh_token_user",
      refreshTokensUsed: [],
    });

    // Generate access tokens
    adminToken = createToken(
      {
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
        tokenVersion: 0,
      },
      adminKeyPair.privateKey,
    );

    regularToken = createToken(
      {
        userId: regularUser._id.toString(),
        email: regularUser.email,
        role: "user",
        tokenVersion: 0,
      },
      regularKeyPair.privateKey,
    );
  });

  // Cleanup after all tests
  afterAll(async () => {
    await userModel.deleteMany({
      email: { $in: ["admin@test.com", "user@test.com"] },
    });
    await keyTokenModel.deleteMany({});
  });

  // ==================== AUTHENTICATION TESTS ====================

  describe("Authentication Middleware", () => {
    it("should reject request without x-client-id header", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Invalid Request");
    });

    it("should reject request without authorization header", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString());

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Invalid Request");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", "Bearer invalid_token_12345");

      expect(response.status).toBe(401);
    });

    it("should accept request with valid authentication", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata).toHaveProperty("username");
    });
  });

  // ==================== AUTHORIZATION TESTS ====================

  describe("Authorization (Role-Based Access Control)", () => {
    it("should allow admin to access admin-only endpoint", async () => {
      const response = await request(app)
        .get("/v1/api/users")
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata).toHaveProperty("users");
      expect(response.body.metadata).toHaveProperty("pagination");
    });

    it("should deny regular user access to admin-only endpoint", async () => {
      const response = await request(app)
        .get("/v1/api/users")
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("permission");
    });

    it("should allow user to update own profile", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          fullName: "Updated Test User",
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata.fullName).toBe("Updated Test User");
    });

    it("should deny user from updating another user's profile", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${adminUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          fullName: "Hacked Admin",
        });

      expect(response.status).toBe(403);
    });

    it("should allow admin to update any user's profile", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Admin Updated User",
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata.fullName).toBe("Admin Updated User");
    });
  });

  // ==================== CRUD OPERATIONS TESTS ====================

  describe("GET /v1/api/users/:userId - Get User Profile", () => {
    it("should get user profile successfully", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata).toHaveProperty("username", "user_test");
      expect(response.body.metadata).toHaveProperty("email", "user@test.com");
      expect(response.body.metadata).not.toHaveProperty("password");
    });

    it("should return 400 for invalid user ID format", async () => {
      const response = await request(app)
        .get("/v1/api/users/invalid_id_format")
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /v1/api/users/:userId - Update User Profile", () => {
    it("should update user profile with valid data", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          fullName: "Updated Full Name",
          bio: "This is my updated bio",
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata.fullName).toBe("Updated Full Name");
      expect(response.body.metadata.bio).toBe("This is my updated bio");
    });

    it("should reject update with invalid email format", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          email: "invalid-email-format",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid email");
    });

    it("should reject update with username too short", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          username: "ab",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("at least 3 characters");
    });

    it("should reject update with bio exceeding 500 characters", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          bio: "A".repeat(501),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Bio cannot exceed 500");
    });

    it("should reject update with duplicate username", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          username: "admin_test", // Admin's username
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Username already exists");
    });
  });

  describe("GET /v1/api/users - Get All Users (Admin Only)", () => {
    it("should get all users with pagination", async () => {
      const response = await request(app)
        .get("/v1/api/users?page=1&limit=10")
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata).toHaveProperty("users");
      expect(response.body.metadata).toHaveProperty("pagination");
      expect(Array.isArray(response.body.metadata.users)).toBe(true);
      expect(response.body.metadata.pagination).toHaveProperty("currentPage");
      expect(response.body.metadata.pagination).toHaveProperty("totalPages");
    });

    it("should filter users by role", async () => {
      const response = await request(app)
        .get("/v1/api/users?role=admin")
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.metadata.users.forEach((user: any) => {
        expect(user.role).toBe("admin");
      });
    });

    it("should filter users by search query", async () => {
      const response = await request(app)
        .get("/v1/api/users?search=user_test")
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata.users.length).toBeGreaterThan(0);
    });

    it("should filter users by isActive status", async () => {
      const response = await request(app)
        .get("/v1/api/users?isActive=true")
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.metadata.users.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    });
  });

  describe("PUT /v1/api/users/:userId/role - Change User Role (Admin Only)", () => {
    it("should change user role successfully", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}/role`)
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`)
        .send({
          role: "author",
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata.role).toBe("author");
      expect(response.body.metadata.tokenVersion).toBe(1); // Should increment
    });

    it("should reject invalid role", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}/role`)
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`)
        .send({
          role: "superadmin",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid role");
    });

    it("should deny regular user from changing roles", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}/role`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          role: "admin",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /v1/api/users/:userId - Soft Delete User (Admin Only)", () => {
    it("should soft delete user successfully", async () => {
      const response = await request(app)
        .delete(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata.isActive).toBe(false);

      // Verify user is soft deleted in database
      const deletedUser = await userModel.findById(regularUser._id);
      expect(deletedUser?.isActive).toBe(false);
    });

    it("should deny regular user from deleting users", async () => {
      const response = await request(app)
        .delete(`/v1/api/users/${adminUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  // ==================== TOKEN VERSIONING TESTS ====================

  describe("Token Versioning - Role Change Invalidation", () => {
    let testUser: any;
    let testUserToken: string;
    let testKeyPair: { publicKey: string; privateKey: string };

    beforeAll(async () => {
      // Create a fresh test user for token versioning tests
      await userModel.deleteOne({ email: "tokentest@test.com" });

      testKeyPair = generateKeyPair();

      testUser = await userModel.create({
        username: "token_test_user",
        email: "tokentest@test.com",
        password: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        fullName: "Token Test User",
        role: "user",
        tokenVersion: 0,
        isActive: true,
      });

      await keyTokenModel.create({
        user: testUser._id,
        publicKey: testKeyPair.publicKey,
        privateKey: testKeyPair.privateKey,
        refreshToken: "dummy_refresh_token_test",
        refreshTokensUsed: [],
      });

      testUserToken = createToken(
        {
          userId: testUser._id.toString(),
          email: testUser.email,
          role: "user",
          tokenVersion: 0,
        },
        testKeyPair.privateKey,
      );
    });

    afterAll(async () => {
      await userModel.deleteOne({ email: "tokentest@test.com" });
      await keyTokenModel.deleteOne({ user: testUser._id });
    });

    it("should work with valid token before role change", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${testUser._id}`)
        .set("x-client-id", testUser._id.toString())
        .set("authorization", `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
    });

    it("should increment tokenVersion when role changes", async () => {
      const response = await request(app)
        .put(`/v1/api/users/${testUser._id}/role`)
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`)
        .send({
          role: "author",
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata.tokenVersion).toBe(1);

      // Verify in database
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser?.tokenVersion).toBe(1);
    });

    it("should reject old token after role change (TOKEN_OUTDATED)", async () => {
      // Use the old token (tokenVersion: 0) after role changed to (tokenVersion: 1)
      const response = await request(app)
        .get(`/v1/api/users/${testUser._id}`)
        .set("x-client-id", testUser._id.toString())
        .set("authorization", `Bearer ${testUserToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Token version is outdated");
      expect(response.body.code).toBe("TOKEN_OUTDATED");
    });

    it("should work with new token after role change", async () => {
      // Generate new token with updated tokenVersion
      const newToken = createToken(
        {
          userId: testUser._id.toString(),
          email: testUser.email,
          role: "author",
          tokenVersion: 1,
        },
        testKeyPair.privateKey,
      );

      const response = await request(app)
        .get(`/v1/api/users/${testUser._id}`)
        .set("x-client-id", testUser._id.toString())
        .set("authorization", `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata.role).toBe("author");
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe("Error Handling", () => {
    it("should return 400 for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439011"; // Valid MongoDB ObjectId format

      const response = await request(app)
        .get(`/v1/api/users/${fakeId}`)
        .set("x-client-id", adminUser._id.toString())
        .set("authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("User not found");
    });

    it("should handle database errors gracefully", async () => {
      // Try to update with invalid data that might cause DB error
      const response = await request(app)
        .put(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`)
        .send({
          email: "admin@test.com", // Duplicate email
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Email already exists");
    });
  });

  // ==================== RESPONSE FORMAT TESTS ====================

  describe("Response Format Consistency", () => {
    it("should return consistent success response format", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("status", 200);
      expect(response.body).toHaveProperty("metadata");
    });

    it("should return consistent error response format", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString());
      // Missing authorization header

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("status");
    });

    it("should never expose password in responses", async () => {
      const response = await request(app)
        .get(`/v1/api/users/${regularUser._id}`)
        .set("x-client-id", regularUser._id.toString())
        .set("authorization", `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata).not.toHaveProperty("password");
    });
  });
});
