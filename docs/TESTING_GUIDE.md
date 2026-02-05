# 🧪 Testing Guide - IE213 Blog System

## 📚 Table of Contents

1. [Overview](#overview)
2. [Testing Stack](#testing-stack)
3. [Project Structure](#project-structure)
4. [Writing Unit Tests](#writing-unit-tests)
5. [Writing Integration Tests](#writing-integration-tests)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Running Tests](#running-tests)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Testing trong IE213 project sử dụng **Jest** và **Supertest** để test cả unit tests (riêng lẻ functions) và integration tests (HTTP endpoints).

### Testing Philosophy

- **Test behavior, not implementation** - Test những gì user/client thấy
- **Test edge cases** - Invalid inputs, boundary conditions
- **Test security** - Authentication, authorization, permission checks
- **Keep tests independent** - Mỗi test có thể chạy riêng lẻ
- **Use descriptive names** - Test name = documentation

---

## 🛠️ Testing Stack

### Dependencies

```json
{
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/supertest": "^6.0.3",
    "jest": "^30.2.0",
    "supertest": "^7.2.2",
    "ts-jest": "^29.4.6"
  }
}
```

### Jest Configuration (`jest.config.cjs`)

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  // ... other configs
};
```

### Key Tools

- **Jest**: Test runner và assertion library
- **Supertest**: HTTP assertions (test API endpoints)
- **ts-jest**: TypeScript support cho Jest

---

## 📁 Project Structure

```
src/
├── tests/
│   ├── user.routes.test.ts        # User API integration tests
│   ├── access.routes.test.ts      # Auth API integration tests
│   ├── post.routes.test.ts        # Post API integration tests
│   └── services/
│       ├── user.service.test.ts   # User service unit tests
│       └── post.service.test.ts   # Post service unit tests
├── services/
│   └── user.service.ts
├── controllers/
│   └── user.controller.ts
└── models/
    └── user.model.ts
```

### Naming Convention

- **Integration tests**: `<feature>.routes.test.ts`
- **Unit tests**: `<feature>.service.test.ts` hoặc `<feature>.test.ts`
- **Test files location**: Cùng folder với code hoặc trong `src/tests/`

---

## ✍️ Writing Unit Tests

Unit tests kiểm tra **một function/method cụ thể** một cách độc lập.

### Basic Structure

```typescript
import { functionToTest } from "../path/to/module.js";

describe("Module Name - Function Name", () => {
  // Setup before tests
  beforeAll(() => {
    // Chạy 1 lần trước tất cả tests
  });

  beforeEach(() => {
    // Chạy trước mỗi test
  });

  // Group related tests
  describe("Feature/Scenario Name", () => {
    it("should do something when condition is met", () => {
      // Arrange - Setup test data
      const input = "test input";

      // Act - Execute function
      const result = functionToTest(input);

      // Assert - Verify result
      expect(result).toBe("expected output");
    });

    it("should throw error when invalid input", () => {
      expect(() => {
        functionToTest(null);
      }).toThrow("Expected error message");
    });
  });

  // Cleanup after tests
  afterEach(() => {
    // Chạy sau mỗi test
  });

  afterAll(() => {
    // Chạy 1 lần sau tất cả tests
  });
});
```

### Example: Testing Service Method

```typescript
// user.service.test.ts
import UserService from "../services/user.service.js";
import { userModel } from "../models/user.model.js";

// Mock mongoose model
jest.mock("../models/user.model.js");

describe("UserService - updateUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update user successfully with valid data", async () => {
    // Mock data
    const userId = "123456789";
    const updateData = {
      fullName: "Updated Name",
      bio: "Updated bio",
    };

    const mockUpdatedUser = {
      _id: userId,
      username: "testuser",
      fullName: "Updated Name",
      bio: "Updated bio",
    };

    // Mock findByIdAndUpdate
    (userModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUpdatedUser),
    });

    // Execute
    const result = await UserService.updateUser({ userId, updateData });

    // Assert
    expect(result).toEqual(mockUpdatedUser);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );
  });

  it("should throw error when email format is invalid", async () => {
    const userId = "123456789";
    const updateData = {
      email: "invalid-email",
    };

    await expect(
      UserService.updateUser({ userId, updateData }),
    ).rejects.toThrow("Invalid email format");
  });

  it("should throw error when username is too short", async () => {
    const userId = "123456789";
    const updateData = {
      username: "ab", // Less than 3 characters
    };

    await expect(
      UserService.updateUser({ userId, updateData }),
    ).rejects.toThrow("Username must be at least 3 characters");
  });
});
```

### Common Assertions

```typescript
// Equality
expect(value).toBe(expected); // Strict equality (===)
expect(value).toEqual(expected); // Deep equality (objects/arrays)

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThan(10);
expect(number).toBeCloseTo(0.3); // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain("substring");

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty("key");
expect(object).toHaveProperty("key", value);
expect(object).toMatchObject({ key: value });

// Exceptions
expect(() => func()).toThrow();
expect(() => func()).toThrow("error message");
expect(() => func()).toThrow(ErrorClass);

// Async
await expect(asyncFunc()).resolves.toBe(value);
await expect(asyncFunc()).rejects.toThrow("error");
```

---

## 🌐 Writing Integration Tests

Integration tests kiểm tra **HTTP endpoints** với real database/app.

### Basic Structure

```typescript
import request from "supertest";
import { app } from "../app.js";
import { userModel } from "../models/user.model.js";

describe("API Endpoint Name", () => {
  // Test data
  let testUser: any;
  let authToken: string;

  // Setup test data before tests
  beforeAll(async () => {
    // Create test user
    testUser = await userModel.create({
      username: "testuser",
      email: "test@test.com",
      password: "hashedpassword",
      role: "user",
    });

    // Generate auth token (helper function)
    authToken = generateTestToken(testUser);
  });

  // Cleanup after tests
  afterAll(async () => {
    await userModel.deleteMany({ email: "test@test.com" });
  });

  it("should return 200 with valid request", async () => {
    const response = await request(app)
      .get(`/v1/api/users/${testUser._id}`)
      .set("x-client-id", testUser._id.toString())
      .set("authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("metadata");
    expect(response.body.metadata.username).toBe("testuser");
  });

  it("should return 401 without authentication", async () => {
    const response = await request(app).get(`/v1/api/users/${testUser._id}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain("Invalid Request");
  });
});
```

### HTTP Methods with Supertest

```typescript
// GET request
await request(app)
  .get("/v1/api/users/123")
  .set("header-name", "value")
  .query({ page: 1, limit: 10 });

// POST request
await request(app)
  .post("/v1/api/users")
  .set("Content-Type", "application/json")
  .send({
    username: "newuser",
    email: "new@test.com",
  });

// PUT request
await request(app).put("/v1/api/users/123").send({ fullName: "Updated Name" });

// DELETE request
await request(app).delete("/v1/api/users/123");

// With authentication headers
await request(app)
  .get("/v1/api/users/123")
  .set("x-client-id", userId)
  .set("authorization", `Bearer ${token}`);
```

### Testing Response Format

```typescript
it("should return consistent response format", async () => {
  const response = await request(app)
    .get("/v1/api/users/123")
    .set("x-client-id", userId)
    .set("authorization", `Bearer ${token}`);

  // Status code
  expect(response.status).toBe(200);

  // Response structure
  expect(response.body).toHaveProperty("message");
  expect(response.body).toHaveProperty("status", 200);
  expect(response.body).toHaveProperty("metadata");

  // Metadata content
  expect(response.body.metadata).toHaveProperty("username");
  expect(response.body.metadata).toHaveProperty("email");
  expect(response.body.metadata).not.toHaveProperty("password");
});
```

---

## 💡 Best Practices

### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
it("should calculate total correctly", () => {
  // Arrange - Setup
  const items = [10, 20, 30];

  // Act - Execute
  const total = calculateTotal(items);

  // Assert - Verify
  expect(total).toBe(60);
});
```

### 2. Descriptive Test Names

```typescript
// ❌ Bad
it("test user update", () => {});

// ✅ Good
it("should update user profile when valid data is provided", () => {});
it("should reject update when email format is invalid", () => {});
it("should throw 403 when user tries to update another user's profile", () => {});
```

### 3. Test One Thing Per Test

```typescript
// ❌ Bad - Testing multiple things
it("should handle user operations", async () => {
  const user = await createUser();
  expect(user).toBeDefined();

  const updated = await updateUser(user._id);
  expect(updated.fullName).toBe("New Name");

  const deleted = await deleteUser(user._id);
  expect(deleted.isActive).toBe(false);
});

// ✅ Good - Separate tests
it("should create user successfully", async () => {
  const user = await createUser();
  expect(user).toBeDefined();
});

it("should update user profile successfully", async () => {
  const updated = await updateUser(user._id);
  expect(updated.fullName).toBe("New Name");
});

it("should soft delete user successfully", async () => {
  const deleted = await deleteUser(user._id);
  expect(deleted.isActive).toBe(false);
});
```

### 4. Independent Tests

```typescript
// ❌ Bad - Tests depend on each other
let userId: string;

it("test 1", () => {
  userId = createUser();
});

it("test 2", () => {
  updateUser(userId); // Depends on test 1
});

// ✅ Good - Each test is independent
describe("User operations", () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await createUser();
  });

  afterEach(async () => {
    await deleteUser(testUser._id);
  });

  it("should update user", async () => {
    await updateUser(testUser._id);
  });

  it("should delete user", async () => {
    await deleteUser(testUser._id);
  });
});
```

### 5. Use Test Data Factories

```typescript
// test-helpers/factories.ts
export const createTestUser = (overrides = {}) => {
  return {
    username: "testuser",
    email: "test@test.com",
    password: "Test@123456",
    fullName: "Test User",
    role: "user",
    ...overrides,
  };
};

// In test file
it("should create admin user", async () => {
  const adminData = createTestUser({ role: "admin" });
  const admin = await createUser(adminData);
  expect(admin.role).toBe("admin");
});
```

### 6. Clean Up Test Data

```typescript
describe("User tests", () => {
  const testEmails: string[] = [];

  afterEach(async () => {
    // Clean up test users created in this test
    await userModel.deleteMany({ email: { $in: testEmails } });
    testEmails.length = 0;
  });

  it("should create user", async () => {
    const email = "test1@test.com";
    testEmails.push(email);

    const user = await createUser({ email });
    expect(user).toBeDefined();
  });
});
```

---

## 🎨 Common Patterns

### Pattern 1: Testing Authentication

```typescript
describe("Authentication Tests", () => {
  it("should reject request without token", async () => {
    const response = await request(app).get("/v1/api/protected-route");

    expect(response.status).toBe(401);
  });

  it("should reject request with invalid token", async () => {
    const response = await request(app)
      .get("/v1/api/protected-route")
      .set("authorization", "Bearer invalid_token");

    expect(response.status).toBe(401);
  });

  it("should accept request with valid token", async () => {
    const token = generateValidToken();

    const response = await request(app)
      .get("/v1/api/protected-route")
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
```

### Pattern 2: Testing Authorization (Roles)

```typescript
describe("Authorization Tests", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    adminToken = generateToken({ role: "admin" });
    userToken = generateToken({ role: "user" });
  });

  it("should allow admin to access admin endpoint", async () => {
    const response = await request(app)
      .get("/v1/api/admin/users")
      .set("authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it("should deny regular user from admin endpoint", async () => {
    const response = await request(app)
      .get("/v1/api/admin/users")
      .set("authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});
```

### Pattern 3: Testing Validation

```typescript
describe("Input Validation Tests", () => {
  it("should accept valid input", async () => {
    const validData = {
      email: "valid@email.com",
      username: "validuser",
      password: "Valid@123456",
    };

    const response = await request(app).post("/v1/api/users").send(validData);

    expect(response.status).toBe(201);
  });

  it("should reject invalid email", async () => {
    const invalidData = {
      email: "invalid-email",
      username: "validuser",
      password: "Valid@123456",
    };

    const response = await request(app).post("/v1/api/users").send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("email");
  });

  it("should reject short password", async () => {
    const invalidData = {
      email: "valid@email.com",
      username: "validuser",
      password: "short",
    };

    const response = await request(app).post("/v1/api/users").send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("password");
  });
});
```

### Pattern 4: Testing Pagination

```typescript
describe("Pagination Tests", () => {
  beforeAll(async () => {
    // Create 25 test users
    const users = Array.from({ length: 25 }, (_, i) => ({
      username: `user${i}`,
      email: `user${i}@test.com`,
      password: "hashedpassword",
    }));
    await userModel.insertMany(users);
  });

  it("should return first page with default limit", async () => {
    const response = await request(app).get("/v1/api/users?page=1&limit=10");

    expect(response.status).toBe(200);
    expect(response.body.metadata.users).toHaveLength(10);
    expect(response.body.metadata.pagination.currentPage).toBe(1);
    expect(response.body.metadata.pagination.hasNextPage).toBe(true);
  });

  it("should return correct page", async () => {
    const response = await request(app).get("/v1/api/users?page=2&limit=10");

    expect(response.body.metadata.pagination.currentPage).toBe(2);
    expect(response.body.metadata.users).toHaveLength(10);
  });

  it("should return last page correctly", async () => {
    const response = await request(app).get("/v1/api/users?page=3&limit=10");

    expect(response.body.metadata.pagination.currentPage).toBe(3);
    expect(response.body.metadata.users).toHaveLength(5); // Only 5 left
    expect(response.body.metadata.pagination.hasNextPage).toBe(false);
  });
});
```

### Pattern 5: Testing Error Handling

```typescript
describe("Error Handling Tests", () => {
  it("should handle not found error", async () => {
    const fakeId = "507f1f77bcf86cd799439011";

    const response = await request(app).get(`/v1/api/users/${fakeId}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("not found");
  });

  it("should handle database connection error", async () => {
    // Mock database error
    jest
      .spyOn(userModel, "findById")
      .mockRejectedValue(new Error("Database connection failed"));

    const response = await request(app).get("/v1/api/users/123");

    expect(response.status).toBe(500);
  });

  it("should handle validation error", async () => {
    const response = await request(app).post("/v1/api/users").send({
      // Missing required fields
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });
});
```

---

## 🚀 Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test user.routes.test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="authentication"
```

### Debug Tests in VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Issue 1: ESM Import Errors

```bash
Error: Cannot use import statement outside a module
```

**Solution:** Check `jest.config.cjs`:

```javascript
module.exports = {
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
```

### Issue 2: MongoDB Connection Timeout

```bash
Error: MongooseServerSelectionError: connect ECONNREFUSED
```

**Solution:** Ensure MongoDB is running before tests:

```bash
docker-compose up -d mongodb
npm test
```

Or mock mongoose in unit tests:

```typescript
jest.mock("mongoose");
```

### Issue 3: Test Timeout

```bash
Error: Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solution:** Increase timeout or use async/await properly:

```typescript
it("should complete async operation", async () => {
  await longRunningOperation();
}, 10000); // 10 second timeout
```

### Issue 4: Port Already in Use

```bash
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:** Use random port for tests:

```typescript
import { app } from "../app.js";

let server: any;

beforeAll((done) => {
  server = app.listen(0, () => {
    // Port 0 = random available port
    done();
  });
});

afterAll((done) => {
  server.close(done);
});
```

### Issue 5: Tests Pass Individually But Fail Together

**Cause:** Shared state between tests

**Solution:** Ensure proper cleanup:

```typescript
afterEach(async () => {
  await userModel.deleteMany({});
  jest.clearAllMocks();
});
```

---

## 📊 Coverage Goals

### Coverage Targets

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

### View Coverage Report

```bash
npm test -- --coverage
# Open: coverage/lcov-report/index.html
```

### Coverage Configuration (`jest.config.cjs`)

```javascript
module.exports = {
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/tests/**",
    "!src/types/**",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

---

## 📚 Additional Resources

### Official Documentation

- Jest: https://jestjs.io/docs/getting-started
- Supertest: https://github.com/ladjs/supertest
- Testing Library: https://testing-library.com/

### Testing Patterns

- Test Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
- AAA Pattern: https://wiki.c2.com/?ArrangeActAssert
- Test Doubles: https://martinfowler.com/bliki/TestDouble.html

### IE213 Project References

- [user.routes.test.ts](../src/tests/user.routes.test.ts) - Complete example
- [TOKEN_VERSION_TESTING.md](./TOKEN_VERSION_TESTING.md) - Token versioning tests
- [API_Documentation.md](./API_Documentation.md) - API specifications

---

## ✅ Testing Checklist

Khi viết tests cho một feature mới:

- [ ] **Unit Tests**
  - [ ] Test happy path (input hợp lệ)
  - [ ] Test edge cases (boundary values)
  - [ ] Test error cases (invalid input)
  - [ ] Test null/undefined handling
- [ ] **Integration Tests**
  - [ ] Test successful request/response
  - [ ] Test authentication required
  - [ ] Test authorization (roles/permissions)
  - [ ] Test validation errors
  - [ ] Test not found errors
  - [ ] Test response format consistency
- [ ] **Security Tests**
  - [ ] Test unauthorized access blocked
  - [ ] Test password not exposed in responses
  - [ ] Test token expiration
  - [ ] Test CSRF protection (if applicable)
- [ ] **Code Quality**
  - [ ] Descriptive test names
  - [ ] Independent tests
  - [ ] Proper cleanup
  - [ ] No hardcoded values
  - [ ] Coverage >80%

---

**Created:** February 5, 2026  
**Last Updated:** February 5, 2026  
**Author:** IE213 Development Team  
**Status:** ✅ Production Ready
