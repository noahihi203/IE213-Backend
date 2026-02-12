# Swagger API Documentation - Quick Guide

## 🚀 Truy cập Swagger UI

Sau khi start server, truy cập:

**Swagger UI**: http://localhost:5000/api-docs

**Swagger JSON**: http://localhost:5000/api-docs.json

---

## 📋 Danh sách APIs đã document

### 🔐 Authentication (4 endpoints)

- `POST /v1/api/register` - Đăng ký tài khoản
- `POST /v1/api/login` - Đăng nhập
- `POST /v1/api/logout` - Đăng xuất (Auth required)
- `POST /v1/api/refresh-token` - Làm mới token (Auth required)

### 📝 Posts (11 endpoints)

- `GET /v1/api/posts` - Lấy danh sách bài viết (Public)
- `GET /v1/api/posts/trending` - Bài viết trending (Public)
- `GET /v1/api/posts/:postId` - Chi tiết bài viết (Public)
- `GET /v1/api/posts/slug/:slug` - Lấy bài viết theo slug (Public)
- `POST /v1/api/posts` - Tạo bài viết (Author/Admin)
- `PUT /v1/api/posts/:postId` - Cập nhật bài viết (Author/Admin)
- `DELETE /v1/api/posts/:postId` - Xóa bài viết (Author/Admin)
- `POST /v1/api/posts/:postId/like` - Like bài viết (Auth)
- `DELETE /v1/api/posts/:postId/like` - Unlike bài viết (Auth)
- `POST /v1/api/posts/:postId/share` - Chia sẻ bài viết (Auth)

### 💬 Comments (7 endpoints)

- `POST /v1/api/comments` - Tạo comment (Auth)
- `GET /v1/api/comments/:commentId` - Chi tiết comment (Auth)
- `PUT /v1/api/comments` - Cập nhật comment (Auth)
- `DELETE /v1/api/comments` - Xóa comment (Auth)
- `POST /v1/api/comments/:commentId/like` - Toggle like comment (Auth)
- `POST /v1/api/comments/:commentId/report` - Báo cáo comment (Auth)

### 📁 Categories (6 endpoints)

- `GET /v1/api/categories` - Danh sách categories (Public)
- `GET /v1/api/categories/:categoryId` - Chi tiết category (Public)
- `GET /v1/api/categories/slug/:slug` - Lấy category theo slug (Public)
- `POST /v1/api/categories` - Tạo category (Admin)
- `PUT /v1/api/categories/:categoryId` - Cập nhật category (Admin)
- `DELETE /v1/api/categories/:categoryId` - Xóa category (Admin)

### 👥 Users (6 endpoints)

- `GET /v1/api/user/:userId` - Profile user (Auth)
- `PUT /v1/api/user/:userId` - Cập nhật profile (Owner/Admin)
- `GET /v1/api/user/users` - Danh sách users (Admin)
- `DELETE /v1/api/user/:userId` - Xóa user (Admin)
- `PUT /v1/api/user/:userId/role` - Thay đổi role (Admin)
- `GET /v1/api/user/comments` - Comments của user (Auth)

**Tổng cộng: 34 endpoints được document**

---

## 🔑 Authentication trên Swagger UI

### Bước 1: Login để lấy token

1. Tìm endpoint `POST /v1/api/login`
2. Click **"Try it out"**
3. Nhập credentials:

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

4. Click **"Execute"**
5. Copy `accessToken` và `_id` từ response

### Bước 2: Authorize

1. Click nút **"Authorize" 🔓** ở góc trên
2. Nhập thông tin:
   - **bearerAuth**: Paste `accessToken` (KHÔNG thêm "Bearer ")
   - **clientId (x-client-id)**: Paste `_id` của user
3. Click **"Authorize"**
4. Click **"Close"**

### Bước 3: Test protected endpoints

Bây giờ tất cả requests sẽ tự động có authentication headers! 🎉

---

## 🏷️ Tags (Nhóm endpoints)

Swagger UI tổ chức endpoints theo tags:

- **Authentication** - Auth & token management
- **Posts** - Blog posts CRUD & interactions
- **Comments** - Comments CRUD & interactions
- **Categories** - Category management
- **Users** - User management & profiles

---

## 📊 Response Format

Tất cả responses tuân theo format chuẩn:

### Success Response

```json
{
  "message": "Operation success!",
  "status": 200,
  "metadata": {
    // Data object hoặc array
  }
}
```

### Error Response

```json
{
  "status": 400,
  "message": "Error description"
}
```

---

## 🎯 Use Cases phổ biến

### 1. Đăng ký & Login

```
1. POST /v1/api/register (tạo tài khoản)
2. POST /v1/api/login (lấy tokens)
3. Authorize trên Swagger UI
```

### 2. Tạo bài viết

```
1. POST /v1/api/categories (Admin tạo category)
2. POST /v1/api/posts (Tạo post trong category)
3. GET /v1/api/posts (Xem danh sách)
```

### 3. Tương tác với bài viết

```
1. GET /v1/api/posts/:postId (Xem bài viết)
2. POST /v1/api/posts/:postId/like (Like)
3. POST /v1/api/comments (Comment)
4. POST /v1/api/comments/:commentId/like (Like comment)
```

### 4. Quản trị users (Admin)

```
1. GET /v1/api/user/users (Danh sách users)
2. PUT /v1/api/user/:userId/role (Đổi role)
3. DELETE /v1/api/user/:userId (Xóa user)
```

---

## 🔒 Phân quyền

### Public (không cần auth)

- Xem posts, categories
- Xem chi tiết bài viết

### Authenticated (cần login)

- Tạo comments
- Like/Unlike posts & comments
- Share posts
- Xem & update profile của mình

### Author/Moderator

- Tạo, sửa, xóa bài viết của mình

### Admin

- Quản lý categories
- Quản lý users (CRUD & role changes)
- Xóa mọi posts/comments

---

## 💡 Tips

### 1. Test multiple scenarios

- Test cả success cases và error cases
- Test với different roles (user, moderator, admin)
- Test pagination với page/limit params

### 2. Save Example values

Swagger UI tự động save values bạn đã nhập, giúp test nhanh hơn

### 3. Copy cURL commands

Click "Copy" button trong response để copy command sử dụng trực tiếp trong terminal

### 4. Check request/response examples

Mỗi endpoint có examples cho request body và response format

---

## 🐛 Troubleshooting

### "401 Unauthorized"

- Kiểm tra đã click "Authorize" chưa
- Token có còn hạn không (2 ngày)
- x-client-id có đúng user ID không

### "403 Forbidden"

- Kiểm tra role của user
- Endpoint có yêu cầu quyền đặc biệt (Admin, Author) không

### "404 Not Found"

- Kiểm tra ID/slug có đúng không
- Resource có tồn tại trong database không

### Swagger UI không hiển thị endpoints

- Restart server: `npm run dev`
- Clear cache browser (Ctrl + Shift + R)
- Kiểm tra console có errors không

---

## 📚 Tài liệu bổ sung

- [API Documentation](./docs/API_Documentation.md) - Chi tiết từng endpoint
- [Authorization Guide](./docs/AUTHORIZATION_GUIDE.md) - Hệ thống phân quyền
- [Testing Guide](./docs/TESTING_GUIDE.md) - Hướng dẫn test APIs

---

## 🔄 Cập nhật Documentation

File chứa Swagger annotations:

- **Main docs**: `src/docs/swagger.docs.ts`
- **Config**: `src/config/swagger.config.ts`
- **Schemas**: Định nghĩa trong swagger.config.ts

Sau khi thêm/sửa endpoints, restart server để cập nhật Swagger UI!
