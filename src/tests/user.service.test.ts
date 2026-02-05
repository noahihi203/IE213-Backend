import UserService from "../services/user.service.js";
import { userModel } from "../models/user.model.js";
import { BadRequestError } from "../core/error.response.js";

// Mock Mongoose model
jest.mock("../models/user.model.js");

describe("UserService Unit Tests", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== findUserByEmail ====================

  describe("findUserByEmail", () => {
    it("should find user by email with default select fields", async () => {
      const mockUser = {
        _id: "123456789",
        email: "test@test.com",
        username: "testuser",
        fullName: "Test User",
        role: "user",
        tokenVersion: 0,
      };

      // Mock the query chain: findOne().select().lean()
      const mockLean = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFindOne = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.findOne as jest.Mock) = mockFindOne;

      const result = await UserService.findUserByEmail({
        email: "test@test.com",
      });

      expect(mockFindOne).toHaveBeenCalledWith({ email: "test@test.com" });
      expect(mockSelect).toHaveBeenCalledWith({
        email: 1,
        password: 1,
        fullName: 1,
        username: 1,
        role: 1,
        tokenVersion: 1,
      });
      expect(result).toEqual(mockUser);
    });

    it("should find user with custom select fields", async () => {
      const mockUser = {
        _id: "123456789",
        email: "test@test.com",
      };

      const mockLean = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFindOne = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.findOne as jest.Mock) = mockFindOne;

      await UserService.findUserByEmail({
        email: "test@test.com",
        select: { email: 1, _id: 1 },
      });

      expect(mockSelect).toHaveBeenCalledWith({ email: 1, _id: 1 });
    });

    it("should return null when user not found", async () => {
      const mockLean = jest.fn().mockResolvedValue(null);
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFindOne = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.findOne as jest.Mock) = mockFindOne;

      const result = await UserService.findUserByEmail({
        email: "nonexistent@test.com",
      });

      expect(result).toBeNull();
    });
  });

  // ==================== getUserById ====================

  describe("getUserById", () => {
    it("should find user by ID successfully", async () => {
      const mockUser = {
        _id: "123456789",
        email: "test@test.com",
        username: "testuser",
        fullName: "Test User",
        role: "user",
        tokenVersion: 0,
      };

      const mockLean = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFindOne = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.findOne as jest.Mock) = mockFindOne;

      const result = await UserService.getUserById({ _id: "123456789" });

      expect(mockFindOne).toHaveBeenCalledWith({ _id: "123456789" });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user ID not found", async () => {
      const mockLean = jest.fn().mockResolvedValue(null);
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFindOne = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.findOne as jest.Mock) = mockFindOne;

      const result = await UserService.getUserById({ _id: "nonexistent123" });

      expect(result).toBeNull();
    });

    it("should find user with custom select fields", async () => {
      const mockUser = { _id: "123", username: "testuser" };

      const mockLean = jest.fn().mockResolvedValue(mockUser);
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
      const mockFindOne = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.findOne as jest.Mock) = mockFindOne;

      await UserService.getUserById({
        _id: "123",
        select: { username: 1 },
      });

      expect(mockSelect).toHaveBeenCalledWith({ username: 1 });
    });
  });

  // ==================== updateUser ====================

  describe("updateUser", () => {
    it("should update user with valid fullName and bio", async () => {
      const userId = "123456789";
      const updateData = {
        fullName: "Updated Name",
        bio: "Updated bio text",
      };

      const mockUpdatedUser = {
        _id: userId,
        username: "testuser",
        fullName: "Updated Name",
        bio: "Updated bio text",
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.updateUser({ userId, updateData });

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should reject update with invalid fields", async () => {
      const userId = "123456789";
      const updateData: any = {
        invalidField: "value",
      };

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Invalid fields: invalidField");
    });

    it("should reject update with invalid email format", async () => {
      const userId = "123456789";
      const updateData = {
        email: "invalid-email-format",
      };

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Invalid email format");
    });

    it("should reject update with duplicate email", async () => {
      const userId = "123456789";
      const updateData = {
        email: "existing@test.com",
      };

      // Mock email already exists
      (userModel.findOne as jest.Mock) = jest.fn().mockResolvedValue({
        _id: "differentId",
        email: "existing@test.com",
      });

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Email already exists");
    });

    it("should accept update with valid unique email", async () => {
      const userId = "123456789";
      const updateData = {
        email: "newemail@test.com",
      };

      // Mock email doesn't exist
      (userModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);

      const mockUpdatedUser = {
        _id: userId,
        email: "newemail@test.com",
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.updateUser({ userId, updateData });

      expect(result.email).toBe("newemail@test.com");
    });

    it("should reject username shorter than 3 characters", async () => {
      const userId = "123456789";
      const updateData = {
        username: "ab",
      };

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Username must be between 3 and 30 characters");
    });

    it("should reject username longer than 30 characters", async () => {
      const userId = "123456789";
      const updateData = {
        username: "a".repeat(31),
      };

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Username must be between 3 and 30 characters");
    });

    it("should reject duplicate username", async () => {
      const userId = "123456789";
      const updateData = {
        username: "existinguser",
      };

      // Mock username already exists
      (userModel.findOne as jest.Mock) = jest.fn().mockResolvedValue({
        _id: "differentId",
        username: "existinguser",
      });

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Username already exists");
    });

    it("should accept valid unique username", async () => {
      const userId = "123456789";
      const updateData = {
        username: "newusername",
      };

      // Mock username doesn't exist
      (userModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);

      const mockUpdatedUser = {
        _id: userId,
        username: "newusername",
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.updateUser({ userId, updateData });

      expect(result.username).toBe("newusername");
    });

    it("should reject fullName shorter than 2 characters", async () => {
      const userId = "123456789";
      const updateData = {
        fullName: "A",
      };

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Full name must be at least 2 characters");
    });

    it("should reject fullName with only whitespace", async () => {
      const userId = "123456789";
      const updateData = {
        fullName: "   ",
      };

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Full name must be at least 2 characters");
    });

    it("should reject bio exceeding 500 characters", async () => {
      const userId = "123456789";
      const updateData = {
        bio: "A".repeat(501),
      };

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("Bio cannot exceed 500 characters");
    });

    it("should accept bio exactly 500 characters", async () => {
      const userId = "123456789";
      const updateData = {
        bio: "A".repeat(500),
      };

      const mockUpdatedUser = {
        _id: userId,
        bio: updateData.bio,
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.updateUser({ userId, updateData });

      expect(result.bio).toBe(updateData.bio);
    });

    it("should throw error when user not found", async () => {
      const userId = "nonexistent123";
      const updateData = {
        fullName: "Test Name",
      };

      const mockSelect = jest.fn().mockResolvedValue(null);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      await expect(
        UserService.updateUser({ userId, updateData }),
      ).rejects.toThrow("User not found");
    });
  });

  // ==================== getAllUsersWithPagination ====================

  describe("getAllUsersWithPagination", () => {
    it("should get users with default pagination", async () => {
      const mockUsers = [
        { _id: "1", username: "user1", role: "user" },
        { _id: "2", username: "user2", role: "user" },
      ];

      const mockLean = jest.fn().mockResolvedValue(mockUsers);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.find as jest.Mock) = mockFind;
      (userModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(2);

      const result = await UserService.getAllUsersWithPagination({});

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalUsers).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("should throw error for invalid page number", async () => {
      await expect(
        UserService.getAllUsersWithPagination({ page: 0 }),
      ).rejects.toThrow("Page must be greater than 0");

      await expect(
        UserService.getAllUsersWithPagination({ page: -1 }),
      ).rejects.toThrow("Page must be greater than 0");
    });

    it("should throw error for invalid limit", async () => {
      await expect(
        UserService.getAllUsersWithPagination({ limit: 0 }),
      ).rejects.toThrow("Limit must be between 1 and 100");

      await expect(
        UserService.getAllUsersWithPagination({ limit: 101 }),
      ).rejects.toThrow("Limit must be between 1 and 100");
    });

    it("should filter users by search query", async () => {
      const mockUsers = [{ _id: "1", username: "searchuser" }];

      const mockLean = jest.fn().mockResolvedValue(mockUsers);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.find as jest.Mock) = mockFind;
      (userModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      await UserService.getAllUsersWithPagination({ search: "searchuser" });

      expect(mockFind).toHaveBeenCalledWith({
        $or: [
          { username: { $regex: "searchuser", $options: "i" } },
          { email: { $regex: "searchuser", $options: "i" } },
          { fullName: { $regex: "searchuser", $options: "i" } },
        ],
      });
    });

    it("should filter users by role", async () => {
      const mockUsers = [{ _id: "1", username: "admin1", role: "admin" }];

      const mockLean = jest.fn().mockResolvedValue(mockUsers);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.find as jest.Mock) = mockFind;
      (userModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      await UserService.getAllUsersWithPagination({ role: "admin" });

      expect(mockFind).toHaveBeenCalledWith({ role: "admin" });
    });

    it("should throw error for invalid role filter", async () => {
      await expect(
        UserService.getAllUsersWithPagination({ role: "invalidrole" }),
      ).rejects.toThrow("Invalid role filter");
    });

    it("should filter users by isActive status", async () => {
      const mockUsers = [{ _id: "1", username: "activeuser", isActive: true }];

      const mockLean = jest.fn().mockResolvedValue(mockUsers);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.find as jest.Mock) = mockFind;
      (userModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      await UserService.getAllUsersWithPagination({ isActive: true });

      expect(mockFind).toHaveBeenCalledWith({ isActive: true });
    });

    it("should calculate pagination metadata correctly", async () => {
      const mockUsers = Array(10)
        .fill(null)
        .map((_, i) => ({ _id: `${i}`, username: `user${i}` }));

      const mockLean = jest.fn().mockResolvedValue(mockUsers);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.find as jest.Mock) = mockFind;
      (userModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(25);

      const result = await UserService.getAllUsersWithPagination({
        page: 2,
        limit: 10,
      });

      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.totalUsers).toBe(25);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it("should indicate no next page on last page", async () => {
      const mockUsers = Array(5)
        .fill(null)
        .map((_, i) => ({ _id: `${i}`, username: `user${i}` }));

      const mockLean = jest.fn().mockResolvedValue(mockUsers);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockSelect = jest.fn().mockReturnValue({ sort: mockSort });
      const mockFind = jest.fn().mockReturnValue({ select: mockSelect });

      (userModel.find as jest.Mock) = mockFind;
      (userModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(25);

      const result = await UserService.getAllUsersWithPagination({
        page: 3,
        limit: 10,
      });

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });
  });

  // ==================== deleteUserById ====================

  describe("deleteUserById", () => {
    it("should soft delete user successfully", async () => {
      const userId = "123456789";
      const mockDeletedUser = {
        _id: userId,
        username: "testuser",
        isActive: false,
      };

      const mockSelect = jest.fn().mockResolvedValue(mockDeletedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.deleteUserById(userId);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { isActive: false } },
        { new: true },
      );
      expect(result.isActive).toBe(false);
    });

    it("should throw error when user not found for deletion", async () => {
      const userId = "nonexistent123";

      const mockSelect = jest.fn().mockResolvedValue(null);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      await expect(UserService.deleteUserById(userId)).rejects.toThrow(
        "User not found",
      );
    });

    it("should not expose password in deleted user response", async () => {
      const userId = "123456789";
      const mockDeletedUser = {
        _id: userId,
        username: "testuser",
        isActive: false,
      };

      const mockSelect = jest.fn().mockResolvedValue(mockDeletedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.deleteUserById(userId);

      expect(result).not.toHaveProperty("password");
      expect(mockSelect).toHaveBeenCalledWith("-password");
    });
  });

  // ==================== updateUserRole ====================

  describe("updateUserRole", () => {
    it("should update user role to poster successfully", async () => {
      const userId = "123456789";
      const newRole = "poster";

      const mockUpdatedUser = {
        _id: userId,
        username: "testuser",
        role: "poster",
        tokenVersion: 1,
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.updateUserRole({ userId, newRole });

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          $set: { role: newRole },
          $inc: { tokenVersion: 1 },
        },
        { new: true, runValidators: true },
      );
      expect(result.role).toBe("poster");
      expect(result.tokenVersion).toBe(1);
    });

    it("should update user role to admin successfully", async () => {
      const userId = "123456789";
      const newRole = "admin";

      const mockUpdatedUser = {
        _id: userId,
        role: "admin",
        tokenVersion: 1,
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.updateUserRole({ userId, newRole });

      expect(result.role).toBe("admin");
    });

    it("should increment tokenVersion when role changes", async () => {
      const userId = "123456789";
      const newRole = "poster";

      const mockUpdatedUser = {
        _id: userId,
        role: "poster",
        tokenVersion: 5, // Simulating multiple role changes
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      await UserService.updateUserRole({ userId, newRole });

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          $inc: { tokenVersion: 1 },
        }),
        expect.any(Object),
      );
    });

    it("should reject invalid role", async () => {
      const userId = "123456789";
      const newRole = "superadmin";

      await expect(
        UserService.updateUserRole({ userId, newRole }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        UserService.updateUserRole({ userId, newRole }),
      ).rejects.toThrow("Invalid role. Must be one of: admin, user, poster");
    });

    it("should throw error when user not found for role update", async () => {
      const userId = "nonexistent123";
      const newRole = "poster";

      const mockSelect = jest.fn().mockResolvedValue(null);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      await expect(
        UserService.updateUserRole({ userId, newRole }),
      ).rejects.toThrow("User not found");
    });

    it("should not expose password in role update response", async () => {
      const userId = "123456789";
      const newRole = "poster";

      const mockUpdatedUser = {
        _id: userId,
        role: "poster",
        tokenVersion: 1,
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      (userModel.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockReturnValue({ select: mockSelect });

      const result = await UserService.updateUserRole({ userId, newRole });

      expect(result).not.toHaveProperty("password");
      expect(mockSelect).toHaveBeenCalledWith("-password");
    });

    it("should accept all valid roles", async () => {
      const userId = "123456789";
      const validRoles = ["admin", "user", "poster"];

      for (const role of validRoles) {
        const mockUpdatedUser = {
          _id: userId,
          role: role,
          tokenVersion: 1,
        };

        const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
        (userModel.findByIdAndUpdate as jest.Mock) = jest
          .fn()
          .mockReturnValue({ select: mockSelect });

        const result = await UserService.updateUserRole({
          userId,
          newRole: role,
        });

        expect(result.role).toBe(role);
      }
    });
  });
});
