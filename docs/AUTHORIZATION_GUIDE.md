# Hướng Dẫn Authorization - Hệ Thống Phân Quyền

## Tổng Quan

Hệ thống sử dụng middleware-based authorization với 3 roles chính:

- **admin**: Toàn quyền quản trị hệ thống
- **poster**: Có thể tạo và quản lý bài viết
- **user**: Người dùng thông thường (chỉ đọc và tương tác)

## Middleware Authorization

### 1. checkAdmin

Kiểm tra user có role admin hay không.

```typescript
import { checkAdmin } from "../middleware/authorization.js";

// Chỉ admin mới truy cập được
router.get("/users", checkAdmin, asyncHandler(userController.getAllUsers));
```

**Ví dụ sử dụng:**

- Xem danh sách tất cả users
- Xóa user
- Thay đổi role của user
- Xem thống kê hệ thống

### 2. checkRoles(...roles)

Kiểm tra user có một trong các roles được chỉ định.

```typescript
import { checkRoles } from "../middleware/authorization.js";

// Chỉ poster hoặc admin mới được tạo post
router.post(
  "/posts",
  checkRoles("poster", "admin"),
  asyncHandler(postController.createPost),
);
```

**Ví dụ sử dụng:**

- Tạo bài viết (poster + admin)
- Quản lý category (admin)
- Kiểm duyệt nội dung (admin + poster)

### 3. checkOwnershipOrAdmin(resourceIdParam)

Kiểm tra user sở hữu resource hoặc là admin.

```typescript
import { checkOwnershipOrAdmin } from "../middleware/authorization.js";

// User chỉ update profile của chính mình, admin update bất kỳ ai
router.put(
  "/users/:userId",
  checkOwnershipOrAdmin("userId"),
  asyncHandler(userController.updateUserProfile),
);
```

**Tham số:**

- `resourceIdParam`: Tên của param chứa ID của resource owner (default: "userId")

**Ví dụ sử dụng:**

- Update user profile
- Delete bài viết của mình
- Edit comment của mình

### 4. checkPosterOrAdmin

Shortcut cho checkRoles("poster", "admin").

```typescript
import { checkPosterOrAdmin } from "../middleware/authorization.js";

router.post(
  "/posts",
  checkPosterOrAdmin,
  asyncHandler(postController.createPost),
);
```

## Cấu Trúc Request Object

Sau khi qua `authentication` middleware, `req.user` sẽ có:

```typescript
req.user = {
  _id: string;      // User ID
  email: string;    // Email
  role: string;     // Role: "admin" | "poster" | "user"
}
```

## Ví Dụ Routes Hoàn Chỉnh

### User Routes

```typescript
import express from "express";
import { authentication } from "../auth/authUtils.js";
import {
  checkAdmin,
  checkOwnershipOrAdmin,
} from "../middleware/authorization.js";
import userController from "../controllers/user.controller.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

const router = express.Router();

// Authentication cho tất cả routes
router.use(authentication);

// Public routes (authenticated users)
router.get("/users/:userId", asyncHandler(userController.getUserProfile));

// Protected routes (owner or admin)
router.put(
  "/users/:userId",
  checkOwnershipOrAdmin("userId"),
  asyncHandler(userController.updateUserProfile),
);

// Admin-only routes
router.get("/users", checkAdmin, asyncHandler(userController.getAllUsers));
router.delete(
  "/users/:userId",
  checkAdmin,
  asyncHandler(userController.deleteUser),
);
router.put(
  "/users/:userId/role",
  checkAdmin,
  asyncHandler(userController.changeUserRole),
);

export default router;
```

### Post Routes (Ví dụ tương lai)

```typescript
router.use(authentication);

// Public routes
router.get("/posts", asyncHandler(postController.getAllPosts));
router.get("/posts/:postId", asyncHandler(postController.getPost));

// Poster/Admin routes
router.post(
  "/posts",
  checkPosterOrAdmin,
  asyncHandler(postController.createPost),
);

// Owner or Admin routes
router.put(
  "/posts/:postId",
  checkOwnershipOrAdmin("authorId"), // Giả sử post có authorId
  asyncHandler(postController.updatePost),
);

router.delete(
  "/posts/:postId",
  checkOwnershipOrAdmin("authorId"),
  asyncHandler(postController.deletePost),
);
```

## API Testing với Postman

### 1. Login để lấy token

```http
POST /v1/api/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login success!",
  "status": 200,
  "metadata": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### 2. Gọi API với Authorization

```http
GET /v1/api/users?page=1&limit=10
x-client-id: 507f1f77bcf86cd799439011
authorization: eyJhbGc...
```

**Query Parameters cho getAllUsers:**

- `page` (number, default: 1): Số trang
- `limit` (number, default: 10, max: 100): Số users mỗi trang
- `search` (string): Tìm kiếm theo username, email, fullName
- `role` (string): Lọc theo role (admin/poster/user)
- `isActive` (boolean): Lọc theo trạng thái active

**Ví dụ:**

```http
GET /v1/api/users?page=2&limit=20&search=john&role=poster&isActive=true
```

**Response:**

```json
{
  "message": "Get all users success!",
  "status": 200,
  "metadata": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com",
        "fullName": "John Doe",
        "role": "poster",
        "isActive": true,
        "createdOn": "2026-02-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 2,
      "totalPages": 5,
      "totalUsers": 98,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": true
    }
  }
}
```

### 3. Test Authorization Errors

**Trường hợp 1: User thường cố gọi admin endpoint**

```http
GET /v1/api/users
x-client-id: <user_id với role=user>
authorization: <user_token>
```

**Response (403):**

```json
{
  "status": 403,
  "message": "Admin access required"
}
```

**Trường hợp 2: User cố update profile người khác**

```http
PUT /v1/api/users/507f1f77bcf86cd799439011
x-client-id: <different_user_id>
authorization: <token của user khác>

{
  "fullName": "Hacked Name"
}
```

**Response (403):**

```json
{
  "status": 403,
  "message": "You don't have permission to access this resource"
}
```

## Luồng Xử Lý Request

```
Request
  ↓
authentication middleware → Verify JWT, set req.user
  ↓
authorization middleware → Check role/ownership
  ↓
Controller → Handle request
  ↓
Service → Business logic + validation
  ↓
Response
```

## Best Practices

### 1. Thứ tự middleware

```typescript
router.use(authentication); // LUÔN LUÔN ĐẦU TIÊN

// Sau đó mới authorization
router.get("/admin-only", checkAdmin, handler);
```

### 2. Kiểm tra ownership trong service

```typescript
// Trong post.service.ts
static updatePost = async ({ postId, userId, updateData }) => {
  const post = await postModel.findById(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  // Double-check ownership (nếu không dùng middleware)
  if (post.authorId.toString() !== userId.toString()) {
    throw new ForBiddenError("Not authorized to update this post");
  }

  // ... update logic
};
```

### 3. Tránh hardcode roles

```typescript
// ❌ Không tốt
if (req.user.role === "admin") { ... }

// ✅ Tốt - dùng middleware
router.get("/path", checkAdmin, handler);
```

### 4. Log authorization failures

```typescript
export const checkAdmin = (req, res, next) => {
  const user = req.user;

  if (!user || user.role !== "admin") {
    console.log(
      `[AUTHORIZATION FAILED] User ${user?._id} attempted admin access`,
    );
    throw new ForBiddenError("Admin access required");
  }

  next();
};
```

## Lưu Ý Quan Trọng

1. **JWT Payload**: Đảm bảo role được include trong JWT khi tạo token
2. **Refresh Token**: Role có thể thay đổi, cân nhắc invalidate old tokens khi change role
3. **Database Query**: Không select password trong response
4. **Soft Delete**: Sử dụng `isActive: false` thay vì xóa thật
5. **Audit Log**: Cân nhắc log tất cả admin actions

## Tích Hợp Frontend

```typescript
// Frontend example
const getAllUsers = async (params) => {
  const response = await apiClient.get("/users", {
    params,
    headers: {
      "x-client-id": userId,
      authorization: accessToken,
    },
  });

  return response.metadata;
};

// Handle 403 errors
if (error.status === 403) {
  toast.error("Bạn không có quyền truy cập");
  router.push("/dashboard");
}
```

## Troubleshooting

### Error: "Authentication required"

- Thiếu `x-client-id` hoặc `authorization` header
- Token hết hạn
- User chưa login

### Error: "Admin access required"

- User không có role admin
- Role không được include trong JWT payload

### Error: "You don't have permission..."

- User cố truy cập resource của người khác
- Không phải owner và không phải admin

## Roadmap

- [ ] Thêm permission-based authorization (chi tiết hơn role)
- [ ] Rate limiting based on roles (admin có limit cao hơn)
- [ ] Audit log cho admin actions
- [ ] IP whitelist cho sensitive operations
