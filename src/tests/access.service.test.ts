import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { Mock } from "jest-mock";

// Mock modules trước khi import
jest.unstable_mockModule("../models/user.model", () => ({
  userModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../services/keyToken.service", () => ({
  default: {
    createKeyToken: jest.fn(),
  },
}));

jest.unstable_mockModule("../auth/authUtils", () => ({
  createTokenPair: jest.fn(),
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn(),
  },
}));

// Dynamic import sau khi mock
const { userModel } = await import("../models/user.model");
const KeyTokenService = (await import("../services/keyToken.service")).default;
const { createTokenPair } = await import("../auth/authUtils");
const bcrypt = (await import("bcrypt")).default;

describe("AccessService", () => {
  let AccessService: typeof import("../services/access.service").default;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Re-import để lấy module mới với mocks
    AccessService = (await import("../services/access.service")).default;
  });

  describe("signUp", () => {
    const signUpData = {
      username: "testuser",
      email: "test@email.com",
      password: "123456",
      fullName: "Test User",
    };

    // Test case 1: Đăng ký thành công
    it("should register a new user successfully", async () => {
      // Arrange - Chuẩn bị dữ liệu mock
      const mockUser = {
        _id: "mockUserId123",
        username: signUpData.username,
        email: signUpData.email,
        fullName: signUpData.fullName,
      };

      const mockTokens = {
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      };

      // Mock các hàm
      (userModel.findOne as Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      (bcrypt.hash as Mock).mockResolvedValue("hashedPassword");
      (userModel.create as Mock).mockResolvedValue(mockUser);
      (createTokenPair as Mock).mockResolvedValue(mockTokens);
      (KeyTokenService.createKeyToken as Mock).mockResolvedValue("publicKey");

      // Act - Thực hiện hàm cần test
      const result = await AccessService.signUp(signUpData);

      // Assert - Kiểm tra kết quả
      expect(result.code).toBe(201);
      expect(result.metadata).toBeDefined();
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: signUpData.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signUpData.password, 10);
      expect(userModel.create).toHaveBeenCalled();
      expect(KeyTokenService.createKeyToken).toHaveBeenCalled();
    });

    // Test case 2: Email đã tồn tại
    it("should throw error if email already exists", async () => {
      // Arrange
      const existingUser = {
        _id: "existingUserId",
        email: signUpData.email,
      };

      (userModel.findOne as Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingUser),
      });

      // Act & Assert
      await expect(AccessService.signUp(signUpData)).rejects.toThrow(
        "Error: Shop already registered!",
      );
    });

    // Test case 3: Tạo keyStore thất bại
    it("should return error if keyStore creation fails", async () => {
      // Arrange
      const mockUser = {
        _id: "mockUserId123",
        username: signUpData.username,
        email: signUpData.email,
        fullName: signUpData.fullName,
      };

      const mockTokens = {
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      };

      (userModel.findOne as Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      (bcrypt.hash as Mock).mockResolvedValue("hashedPassword");
      (userModel.create as Mock).mockResolvedValue(mockUser);
      (createTokenPair as Mock).mockResolvedValue(mockTokens);
      (KeyTokenService.createKeyToken as Mock).mockResolvedValue(null);

      // Act
      const result = await AccessService.signUp(signUpData);

      // Assert
      expect(result.code).toBe("xxxx");
      expect(result.message).toBe("keyStore error");
    });

    // Test case 4: User không được tạo
    it("should return null metadata if user creation returns falsy", async () => {
      // Arrange
      (userModel.findOne as Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      (bcrypt.hash as Mock).mockResolvedValue("hashedPassword");
      (userModel.create as Mock).mockResolvedValue(null);

      // Act
      const result = await AccessService.signUp(signUpData);

      // Assert
      expect(result.code).toBe(200);
      expect(result.metadata).toBeNull();
    });
  });
});
