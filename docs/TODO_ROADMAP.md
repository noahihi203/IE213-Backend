# Hệ Thống Blog IE213 - Lộ Trình Phát Triển

## Ngày 0 (4 tháng 2, 2026)

### ✅ Các Tính Năng Đã Hoàn Thành

#### Hệ Thống Xác Thực

- [x] Đăng ký người dùng với tạo cặp khóa RSA
- [x] Đăng nhập người dùng với cặp JWT token
- [x] Refresh token với phát hiện tái sử dụng
- [x] Chức năng đăng xuất
- [x] Middleware xác thực
- [x] Model User với mã hóa mật khẩu bcrypt
- [x] Model KeyToken để quản lý token

#### Tài Liệu API

- [x] Tài liệu API đầy đủ cho tất cả endpoints đã lên kế hoạch
- [x] Ví dụ Request/Response
- [x] Schemas của các model database
- [x] Tài liệu xử lý lỗi

---

## 📋 Danh Sách Công Việc Phát Triển

### Ngày 1 (5 tháng 2, 2026) - Service Quản Lý User

**Độ ưu tiên: CAO**

#### Buổi Sáng (4-5 giờ)

- [x] Tạo `user.controller.ts` với tất cả endpoints cho user
  - [x] getUserProfile (GET /v1/api/users/:userId)
  - [x] updateUserProfile (PUT /v1/api/users/:userId)
  - [x] getAllUsers (GET /v1/api/users) - Chỉ Admin
  - [x] deleteUser (DELETE /v1/api/users/:userId) - Chỉ Admin
  - [x] changeUserRole (PUT /v1/api/users/:userId/role) - Chỉ Admin

#### Buổi Chiều (3-4 giờ)

- [x] Mở rộng `user.service.ts` với business logic
  - [x] Method getUserById
  - [x] Method updateUser với validation (email format, username length, uniqueness checks)
  - [x] Method getAllUsersWithPagination (with search, role filter, isActive filter)
  - [x] Method deleteUserById (soft delete - đổi status thành inactive)
  - [x] Method updateUserRole với validation role

- [x] Tạo user routes trong `src/routes/user/index.ts`
  - [x] Thiết lập tất cả 5 user endpoints
  - [x] Thêm authentication middleware
  - [x] Thêm role-based authorization middleware (cho admin routes)

- [x] Đăng ký user routes trong `src/routes/index.ts`

#### Bonus Features Hoàn Thành

- [x] **Token Versioning System** - Invalidate tokens khi role thay đổi
  - [x] Added `tokenVersion` field to User model
  - [x] JWT payload includes tokenVersion
  - [x] Authentication middleware validates tokenVersion
  - [x] Auto-increment tokenVersion on role change
  - [x] Custom `TOKEN_OUTDATED` error code for frontend handling
- [x] **Advanced Authorization Middleware** (`src/auth/authorization.ts`)
  - [x] `checkAdmin` - Admin-only access
  - [x] `checkRoles(...roles)` - Multiple role support
  - [x] `checkOwnershipOrAdmin` - Owner or admin can access
  - [x] `checkPosterOrAdmin` - For post creation routes

- [x] **Comprehensive Testing Documentation** (`TOKEN_VERSION_TESTING.md`)

#### Testing & Tài Liệu

- [x] Test tất cả user endpoints với Postman
- [x] Tạo test file `src/tests/user.routes.test.ts`
- [x] Viết unit tests cơ bản cho các methods của user service

**Thời gian thực tế: ~8 giờ (bao gồm token versioning & authorization system)**

---

### Ngày 2 (8 tháng 2, 2026) - Admin Role Management & Security

**Độ ưu tiên: CAO**

#### Buổi Sáng (3-4 giờ)

- [x] **Admin Role Protection System**
  - [x] Implement `checkMinimumAdmins` middleware
    - [x] Query active admin count before role change
    - [x] Prevent admin demotion if count <= minimum (e.g., 1-2 admins)
    - [x] Custom error: `MINIMUM_ADMINS_REQUIRED`
  - [x] Implement `checkMaximumAdmins` middleware
    - [x] Query active admin count before role promotion
    - [x] Prevent admin promotion if count >= maximum (e.g., 5 admins)
    - [x] Custom error: `MAXIMUM_ADMINS_REACHED`
  - [x] Update `updateUserRole` service method
    - [x] Add validation for self-demotion (admin lowering own role)
    - [x] Add validation for admin-to-admin role changes
    - [x] Add checks using new middleware
    - [x] Add logging for all admin role changes (audit trail)

#### Buổi Chiều (2-3 giờ)

- [x] **Admin Configuration & Constants**
  - [x] Create `src/config/admin.config.ts`
    - [x] `MIN_ACTIVE_ADMINS` constant (default: 1)
    - [x] `MAX_ACTIVE_ADMINS` constant (default: 5)
    - [x] `SUPER_ADMIN_ID` for initial admin (cannot be demoted)
  - [x] Update User model (optional)
    - [x] Add `isSuperAdmin` boolean field (default: false)
    - [x] First registered admin automatically becomes super admin

- [x] **Enhanced Authorization Rules**
  - [x] Update `authorization.ts`
    - [x] Add `checkNotSelfDemotion` middleware
    - [x] Add `checkSuperAdminProtection` middleware
    - [x] Add `checkAdminToAdminPermission` middleware

#### Testing & Documentation

- [x] Test admin protection scenarios
  - [x] Test minimum admin limit enforcement
  - [x] Test maximum admin limit enforcement
  - [x] Test admin self-demotion prevention
  - [x] Test super admin protection
  - [x] Test admin changing other admin's role
- [x] Update API documentation with new error codes
- [x] Create `ADMIN_ROLE_MANAGEMENT.md` documentation

**Thời gian ước tính: 5-7 giờ**

---

### Ngày 3 (9 tháng 2, 2026) - Quản Lý Category

**Độ ưu tiên: CAO**

#### Buổi Sáng (3-4 giờ)

- [x] Tạo `category.service.ts`
  - [x] Method getAllCategories
  - [x] Method getCategoryById
  - [x] Method getCategoryBySlug
  - [x] Method createCategory với tạo slug tự động
  - [x] Method updateCategory
  - [x] Method deleteCategory (kiểm tra các posts liên quan)
  - [x] Method getCategoryPostCount

- [x] Tạo `category.controller.ts`
  - [x] getAllCategories (GET /v1/api/categories)
  - [x] getSingleCategory (GET /v1/api/categories/:categoryId)
  - [x] getCategoryBySlug (GET /v1/api/categories/slug/:slug)
  - [x] createCategory (POST /v1/api/categories) - Chỉ Admin
  - [x] updateCategory (PUT /v1/api/categories/:categoryId) - Chỉ Admin
  - [x] deleteCategory (DELETE /v1/api/categories/:categoryId) - Chỉ Admin

#### Buổi Chiều (2-3 giờ)

- [x] Tạo category routes trong `src/routes/category/index.ts`
  - [x] Thiết lập tất cả category endpoints
  - [x] Thêm authentication cho protected routes
  - [x] Thêm admin authorization cho create/update/delete

- [x] Đăng ký category routes vào main router

#### Testing

- [x] Test tất cả category endpoints
- [x] Tạo `src/tests/category.routes.test.ts`
- [x] Seed database với categories ban đầu (Technology, Lifestyle, Business, v.v.)

**Thời gian ước tính: 5-7 giờ**

---

### Ngày 4 (10 tháng 2, 2026) - Quản Lý Post (Phần 1)

**Độ ưu tiên: CAO**

#### Buổi Sáng (4-5 giờ)

- [x] Tạo `post.service.ts` - CRUD cơ bản
  - [x] Method getAllPostsWithFilters (pagination, search, sort, status filter)
  - [x] Method getPostById (kèm author và category population)
  - [x] Method getPostBySlug
  - [x] Method createPost với tạo slug tự động
  - [x] Method updatePost với kiểm tra authorization
  - [x] Method deletePost (soft delete - chuyển sang archived)
  - [x] Method incrementViewCount

#### Buổi Chiều (3-4 giờ)

- [x] Tạo `post.controller.ts` - Endpoints cơ bản
  - [x] getAllPosts (GET /v1/api/posts)
  - [x] getSinglePost (GET /v1/api/posts/:postId)
  - [x] getPostBySlug (GET /v1/api/posts/slug/:slug)
  - [x] createPost (POST /v1/api/posts) - Chỉ Poster/Admin
  - [x] updatePost (PUT /v1/api/posts/:postId) - Chỉ Author/Admin
  - [x] deletePost (DELETE /v1/api/posts/:postId) - Chỉ Author/Admin

- [x] Tạo post routes trong `src/routes/post/index.ts`
  - [x] Thiết lập CRUD endpoints cơ bản
  - [x] Thêm authentication middleware
  - [x] Thêm role-based authorization (author/admin cho create)
  - [x] Thêm ownership check middleware (cho update/delete)

**Thời gian ước tính: 7-9 giờ**

---

### Ngày 5 (11 tháng 2, 2026) - Quản Lý Post (Phần 2) - Likes & Shares

**Độ ưu tiên: CAO**

#### Buổi Sáng (3-4 giờ)

- [x] Tạo `like.service.ts`
  - [x] Method likePost (tạo like record)
  - [x] Method unlikePost (xóa like record)
  - [x] Method isPostLikedByUser
  - [x] Method getPostLikesCount
  - [x] Method likeComment
  - [x] Method unlikeComment
  - [x] Method isCommentLikedByUser
  - [x] Method getCommentLikesCount

- [x] Tạo `share.service.ts`
  - [x] Method createShare
  - [x] Method getPostSharesCount
  - [x] Method getUserShares

#### Buổi Chiều (3-4 giờ)

- [x] Mở rộng `post.service.ts` với engagement methods
  - [x] Method getTrendingPosts (tính toán dựa trên views, likes, comments)
  - [x] Method getPostWithEngagement (bao gồm likes, shares counts)

- [x] Mở rộng `post.controller.ts` với engagement endpoints
  - [x] likePost (POST /v1/api/posts/:postId/like)
  - [x] unlikePost (DELETE /v1/api/posts/:postId/like)
  - [x] sharePost (POST /v1/api/posts/:postId/share)
  - [x] getTrendingPosts (GET /v1/api/posts/trending)

- [x] Cập nhật post routes với endpoints mới

#### Testing

- [x] Test chức năng like/unlike
- [x] Test chức năng share
- [x] Test thuật toán trending posts
- [x] Tạo integration tests

**Thời gian ước tính: 6-8 giờ**

---

### Ngày 6 (12-13 tháng 2, 2026) - Quản Lý Comment

**Độ ưu tiên: CAO**

#### Buổi Sáng (4-5 giờ)

- [x] Tạo `comment.service.ts`
  - [x] Method createComment (với nested set model cho tree structure)
  - [x] Method getCommentByParentId (merged vào createComment với parentCommentId)
  - [x] Method deleteComments (cascade delete với nested set, auth chủ sở hữu hoặc admin?)
  - [x] Method updateComment (với kiểm tra ownership + ForBiddenError, auth chủ sở hữu)
  - [x] Method getCommentById
  - [x] Method getCommentCount (với support parentCommentId cho replies count)
  - [x] Method toggleLikeComment (kết hợp like/unlike trong 1 method)
  - [x] Method reportComment (với embedded reports array)
  - [x] Method getUserComments (lấy comment history của user)

- [x] Mở rộng `post.controller.ts`
      [x] getPostComments (GET /v1/api/posts/comments)
      [x] getCommentCount (GET /v1/api/posts/comment-count)
- [x] Mở rộng `user.controller.ts`
      [x] getUserComments (GET /v1/api/user/comments)

#### Buổi Chiều (3-4 giờ)

- [x] Tạo `comment.controller.ts`
  - [x] createComment (POST /v1/api/comments)
  - [x] getCommentById (GET /v1/api/comments/:commentId)
  - [x] editComment (PUT /v1/api/comments)
  - [x] deleteCommentById (DELETE /v1/api/comments)
  - [x] toggleLikeComment (POST /v1/api/comments/:commentId/like)
  - [x] reportComment (POST /v1/api/comments/:commentId/report)

- [x] Tạo comment routes trong `src/routes/comment/index.ts`
  - [x] Thiết lập tất cả comment endpoints
  - [x] Thêm authentication middleware
  - [x] Thêm ownership check cho update/delete

---

### Ngày 7 (13 tháng 2, 2026) - Hệ Thống Notification

**Độ ưu tiên: TRUNG BÌNH**

#### Buổi Sáng (4-5 giờ)

- [x] Tạo `notification.service.ts`
  - [x] Method createNotification (generic)
  - [x] Method getUserNotifications (với filters: isRead, type)
  - [x] Method markAsRead
  - [x] Method markAllAsRead
  - [x] Method deleteNotification
  - [x] Method deleteAllRead
  - [x] Các methods kích hoạt Notification:
    - [x] notifyOnPost
    - [x] notifyOnComment
    - [x] notifyOnUser

#### Buổi Chiều (3-4 giờ)

- [x] Tạo `notification.controller.ts`
  - [x] getUserNotifications (GET /v1/api/notifications)
  - [x] markAsRead (PUT /v1/api/notifications/:notificationId/read)
  - [x] markAllAsRead (PUT /v1/api/notifications/read-all)
  - [x] deleteNotification (DELETE /v1/api/notifications/:notificationId)
  - [x] deleteAllRead (DELETE /v1/api/notifications/read)

- [x] Tạo notification routes trong `src/routes/notification/index.ts`

- [x] Tích hợp notification triggers vào:
  - [x] Các thao tác like/unlike post
  - [x] Tạo comment
  - [x] Các thao tác like comment
  - [x] Các thao tác share post

#### Buổi Tối / Tối ưu hóa (3-4 giờ)

- [x] **Apache Kafka Integration cho Notification System**
  - [x] Thiết lập Kafka Producer
    - [x] Tạo `src/services/kafka/kafka.producer.ts`
    - [x] Cấu hình Kafka client kết nối đến Kafka broker (localhost:9092)
    - [x] Implement Producer với các methods:
      - [x] `publishNotificationEvent(topic, message)` - Publish event notification
      - [x] `connect()` và `disconnect()` lifecycle methods
      - [x] Error handling và retry logic
  - [x] Thiết lập Kafka Consumer
    - [x] Tạo `src/services/kafka/kafka.consumer.ts`
    - [x] Implement Consumer để lắng nghe notification events
    - [x] Subscribe to topics: `notification-created`, `notification-batch`
    - [x] Process messages và lưu vào MongoDB
    - [x] Implement batching cho high traffic scenarios
  - [x] Kafka Topics Configuration
    - [x] `notification-created` - Single notification events
    - [x] `notification-batch` - Batch notifications (viral posts)
    - [x] `notification-priority` - High priority notifications (admin alerts)
  - [x] Tích hợp vào Notification Service
    - [x] Update `notification.service.ts` để publish events to Kafka thay vì write trực tiếp DB
    - [x] Implement async notification processing
    - [x] Add fallback mechanism nếu Kafka unavailable
  - [x] Benefits của Kafka Integration:
    - Giảm load trực tiếp lên database
    - Xử lý được notification bursts khi post viral
    - Có thể scale horizontally bằng cách thêm consumers
    - Event replay capability cho debugging
    - Decoupling giữa notification creation và storage

**Thời gian ước tính: 10-13 giờ tổng cộng (bao gồm Kafka integration)**

---

### Ngày 8 (14 tháng 2, 2026) - Thống Kê & Admin Dashboard

**Độ ưu tiên: TRUNG BÌNH**

#### Buổi Sáng (4-5 giờ)

- [x] Tạo `statistics.service.ts`
  - [x] Method getDashboardStats
    - Tổng users, posts, comments, likes, shares, views
    - Số lượng user/post mới (Growth chart)
    - Tỷ lệ content health (published/draft/archived)
    - Top categories
  - [x] Method getUserStatistics
    - Phân loại Users (Role, Active/Inactive)
    - Top contributors (theo độ tương tác)
  - [x] Method getPostStatistics
    - Top posts (theo views & engagement)

#### Buổi Chiều (3-4 giờ)

- [x] Mở rộng `statistics.service.ts`
  - [x] Method getActivityStatistics
    - Xu hướng hoạt động (likes, comments, shares theo ngày - 30 ngày)
    - Những giờ hoạt động nhiều nhất (peak hours)
  - [x] Method getCategoryStatistics
    - Posts theo từng category (kèm status breakdown)
    - Engagement theo từng category
    - Avg engagement per post

- [x] Tạo `statistics.controller.ts`
  - [x] getDashboardStats (GET /v1/api/admin/stats/dashboard)
  - [x] getUserStats (GET /v1/api/admin/stats/users)
  - [x] getPostStats (GET /v1/api/admin/stats/posts)
  - [x] getActivityStats (GET /v1/api/admin/stats/activity)
  - [x] getCategoryStats (GET /v1/api/admin/stats/categories)

- [x] Tạo admin routes trong `src/routes/admin/index.ts`
  - [x] Thêm admin-only middleware
  - [x] Đăng ký tất cả statistics endpoints

**Thời gian ước tính: 7-9 giờ**

---

### Ngày 9 (15 tháng 2, 2026) - Input Validation & Hoàn Thiện Middleware

**Độ ưu tiên: CAO**

#### Đã Hoàn Thành Trước Đó (từ Ngày 1-2)

- [x] `src/middleware/authorization.ts` — 8 middleware functions đã triển khai:
  - [x] `checkAdmin` — Kiểm tra role admin (đã áp dụng cho Category CUD, Admin stats, User admin routes)
  - [x] `checkRoles(...roles)` — Hỗ trợ nhiều roles (đã định nghĩa)
  - [x] `checkOwnershipOrAdmin(param)` — Owner hoặc admin (đã áp dụng cho PUT /user/:userId)
  - [x] `checkAuthorOrAdmin` — Author/admin gate (đã áp dụng cho Post CUD)
  - [x] `checkNotSelfDemotion` — Chống admin tự hạ role
  - [x] `checkSuperAdminProtection` — Bảo vệ super admin
  - [x] `checkAdminToAdminPermission` — Chỉ super admin đổi role admin khác
  - [x] `checkMinimumAdmins` / `checkMaximumAdmins` — Giới hạn số lượng admin
- [x] `src/auth/authUtils.ts` — Authentication middleware hoàn chỉnh (RSA RS256, token versioning)

#### Công Việc Hôm Nay (4-6 giờ)

- [x] **Tạo `src/middleware/validation.ts`** — Input validation cho tất cả endpoints
  - [x] Cài đặt thư viện validation (zod hoặc joi)
  - [x] `validateRegisterInput` — email format, password strength, username length (3-30 chars)
  - [x] `validateLoginInput` — email required, password required
  - [x] `validateUpdateUserInput` — avatar, bio, fullName valid
  - [x] `validateUpdateUserEmailInput` — email valid
  - [x] `validateUpdateUsernameInput` — username valid
  - [x] `validatePostInput` — title required (5-200 chars), content required, categoryId valid ObjectId
  - [x] `validateUpdatePostInput` — partial validation cho update
  - [x] `validateCommentInput` — content required (1-2000 chars), postId valid ObjectId
  - [x] `validateCategoryInput` — name required (2-50 chars), description optional

- [x] **Bổ sung ownership middleware còn thiếu**
  - [x] `checkPostOwnership` — Xác minh user sở hữu post (hiện chỉ có role check, chưa verify ownership thực sự)
  - [x] `checkCommentOwnership` — Xác minh user sở hữu comment (hiện chỉ check ở service layer)

- [x] **Áp dụng validation middleware vào routes**
  - [x] Access routes: validateRegisterInput, validateLoginInput
  - [x] User routes: validateUpdateUserInput
  - [x] Post routes: validatePostInput, validateUpdatePostInput
  - [x] Comment routes: validateCommentInput
  - [x] Category routes: validateCategoryInput

- [ ] Testing
  - [ ] Test validation với inputs không hợp lệ (missing fields, wrong types, quá dài)
  - [ ] Test ownership middleware
  - [ ] Test error responses trả về đúng status code

**Thời gian ước tính: 4-6 giờ**

---

### Ngày 10 (16 tháng 2, 2026) - Xử Lý Lỗi & Structured Logging

**Độ ưu tiên: TRUNG BÌNH**

#### Đã Có Sẵn

- [x] Error classes cơ bản trong `src/core/error.response.ts` (ErrorResponse, BadRequestError, AuthFailureError, NotFoundError, ForBiddenError)
- [x] Global error handler trong `src/app.ts` (404 catch-all + final error handler)
- [x] Admin error codes (`AdminErrorCodes`, `AdminErrorMessages`)
- [x] Morgan HTTP request logging (stdout only)
- [x] `asyncHandler` cho promise rejection catching

#### Công Việc (4-5 giờ)

- [ ] **Cài đặt và cấu hình Winston logger**
  - [ ] `npm install winston winston-daily-rotate-file`
  - [ ] Tạo `src/config/logger.config.ts`
    - [ ] Transport: Console (colorized cho dev) + File rotation
    - [ ] Log levels: error, warn, info, http, debug
    - [ ] Format: timestamp + JSON cho production, pretty-print cho development
  - [ ] Tạo cấu trúc log files:
    - [ ] `logs/error-%DATE%.log` — Chỉ errors
    - [ ] `logs/combined-%DATE%.log` — Tất cả logs
    - [ ] Log rotation: giữ 14 ngày, max 20MB/file

- [ ] **Thay thế console.log/console.error bằng Winston**
  - [ ] `authUtils.ts` — Auth failures, token verification errors
  - [ ] `authorization.ts` — Authorization denials, admin operations
  - [ ] Tất cả services — Business logic operations
  - [ ] `init.mongodb.ts` — Database connection events

- [ ] **Tạo HTTP request logging middleware**
  - [ ] Thay morgan bằng Winston-based request logger
  - [ ] Log: method, url, status, response time, user ID (nếu authenticated)
  - [ ] Skip logging cho health check endpoints

- [ ] **Thêm error classes mới nếu cần**
  - [ ] `ValidationError` (422) — Cho input validation failures
  - [ ] `TooManyRequestsError` (429) — Chuẩn bị cho rate limiting
  - [ ] `InternalServerError` (500) — Explicit internal errors

**Thời gian ước tính: 4-5 giờ**

---

### Ngày 11 (17 tháng 2, 2026) - Testing & Kiểm Tra Chất Lượng

**Độ ưu tiên: CAO**

#### Đã Có Sẵn

- [x] Jest config (`jest.config.cjs`) với ts-jest + ESM support
- [x] Test dependencies: jest@30.2.0, ts-jest, supertest
- [x] `user.service.test.ts` — 759 dòng, unit tests cho UserService
- [x] `user.routes.test.ts` — 613 dòng, integration tests cho user routes
- [x] `notification.e2e.test.ts` — 145 dòng, E2E tests
- [x] `kafka-producer.test.ts` + `kafka-consumer.test.ts` — Kafka integration tests
- [ ] ⚠️ Coverage report hiện tại: 0% — Tests có thể chưa chạy thành công (ESM/connection issues)

#### Buổi Sáng (4-5 giờ)

- [ ] **Sửa test infrastructure**
  - [ ] Debug và fix Jest ESM issues (coverage = 0%)
  - [ ] Đảm bảo tất cả tests hiện có chạy được (`npm test`)
  - [ ] Fix database connection issues trong test environment (mock hoặc test DB)

- [ ] **Hoàn thành unit tests cho các services còn thiếu**
  - [ ] `access.service.test.ts` — signUp, login, refreshToken, logout
  - [ ] `post.service.test.ts` — CRUD, filters, trending, engagement
  - [ ] `comment.service.test.ts` — CRUD, nested comments, like toggle, report
  - [ ] `category.service.test.ts` — CRUD, slug generation, post count check
  - [ ] `like.service.test.ts` — like/unlike post & comment
  - [ ] `statistics.service.test.ts` — Dashboard, user, post, activity, category stats

#### Buổi Chiều (4-5 giờ)

- [ ] **Integration tests**
  - [ ] Full user flow: đăng ký → đăng nhập → tạo post → comment → like
  - [ ] Authentication flow: register → login → refresh token → logout
  - [ ] Authorization tests: admin vs user vs poster access control
  - [ ] Engagement flow: like → unlike → share → trending calculation

- [ ] **Chạy coverage và đạt mục tiêu**
  - [ ] Target: ≥ 60% statement coverage cho services
  - [ ] Target: ≥ 80% coverage cho middleware/auth
  - [ ] Fix any uncovered edge cases

**Thời gian ước tính: 8-10 giờ**

---

## 🎯 Giai Đoạn 2 - Tính Năng Nâng Cao (Tuần 3+)

### Tuần 3 - Hiệu Suất & Tối Ưu Hóa

#### Ngày 12-13 (18-19 tháng 2, 2026): Caching với Redis

- [ ] Cài đặt và cấu hình Redis (`ioredis`)
- [ ] Tạo `src/services/redis.service.ts`
  - [ ] Connection singleton pattern
  - [ ] Helper methods: get, set, del, setWithTTL
- [ ] Triển khai caching cho:
  - [ ] Trending posts (TTL: 5 phút)
  - [ ] Danh sách categories (TTL: 1 giờ, invalidate khi CUD)
  - [ ] User profile công khai (TTL: 10 phút)
  - [ ] Post view counts (batch write mỗi 30s thay vì mỗi request)
- [ ] Cache invalidation strategy:
  - [ ] Write-through cho categories
  - [ ] TTL-based cho trending/profiles
  - [ ] Pub/sub cho multi-instance invalidation

#### Ngày 14-15 (20-21 tháng 2, 2026): Tối Ưu Hóa Database

- [ ] Thêm MongoDB indexes cho các fields thường xuyên query:
  - [ ] Posts: `{ slug: 1 }`, `{ author: 1, status: 1 }`, `{ category: 1, status: 1 }`, text index `{ title, content, excerpt }`
  - [ ] Comments: `{ commentPostId: 1, commentParentId: 1 }`
  - [ ] Likes: `{ userId: 1, targetId: 1, targetType: 1 }` (unique compound)
  - [ ] Notifications: `{ userId: 1, isRead: 1, createdOn: -1 }`
- [ ] Tối ưu hóa aggregation pipelines trong StatisticsService
- [ ] Tối ưu hóa populate operations (select chỉ fields cần thiết)
- [ ] Thêm lean() cho read-only queries
- [ ] Analyze slow queries với MongoDB profiler

#### Ngày 16 (22 tháng 2, 2026): Rate Limiting & Security Hardening

- [ ] Cài đặt `express-rate-limit` + `rate-limit-redis` (nếu Redis đã có)
- [ ] Triển khai rate limiting:
  - [ ] Global: 100 requests/15 phút cho anonymous
  - [ ] Authenticated: 300 requests/15 phút
  - [ ] Auth endpoints (login/register): 5 requests/15 phút (chống brute force)
  - [ ] Admin endpoints: 500 requests/15 phút
  - [ ] POST endpoints (create): 30 requests/15 phút
- [ ] Thêm rate limit headers (`X-RateLimit-*`) vào responses
- [ ] Security hardening:
  - [ ] Rà soát cấu hình helmet
  - [ ] Thêm CORS whitelist cụ thể (thay vì wildcard)
  - [ ] Sanitize MongoDB queries (chống NoSQL injection)

---

### Tuần 4 - Tính Năng Nâng Cao

#### Ngày 17-18 (23-24 tháng 2, 2026): Full-text Search & Upload File

- [ ] **Full-text Search cho Posts**
  - [ ] Tạo MongoDB text indexes trên title, content, excerpt
  - [ ] Implement search endpoint với relevance scoring (`$meta: "textScore"`)
  - [ ] Bộ lọc nâng cao: khoảng thời gian, nhiều categories, status
  - [ ] Search suggestions/autocomplete (prefix matching trên title)
  - [ ] Highlight matched terms trong kết quả

- [ ] **Upload File System**
  - [ ] Cài đặt `multer` + `sharp` (image optimization)
  - [ ] Cấu hình storage: local `uploads/` folder (chuyển cloud sau)
  - [ ] Tạo `src/services/upload.service.ts`
  - [ ] Tạo `src/controllers/upload.controller.ts`
  - [ ] Endpoints:
    - [ ] POST /v1/api/upload/image — Upload ảnh chung (max 5MB, jpg/png/webp)
    - [ ] POST /v1/api/upload/avatar — Upload avatar (resize 200x200)
    - [ ] DELETE /v1/api/upload/:fileId
  - [ ] Serve static files: `GET /uploads/*`
  - [ ] Tích hợp avatar upload vào User update
  - [ ] Tích hợp cover image vào Post create/update

#### Ngày 19-20 (25-26 tháng 2, 2026): Tích Hợp Frontend (Backend Support)

- [ ] **Rà soát và fix CORS cho Frontend**
  - [ ] Cấu hình CORS origin cụ thể: `http://localhost:3000`
  - [ ] Cho phép credentials (cookies/auth headers)
  - [ ] Test tất cả endpoints từ Frontend axios client
- [ ] **Fix các vấn đề tích hợp**
  - [ ] Đảm bảo response format nhất quán (`{ message, status, metadata }`)
  - [ ] Verify token flow: login → store → attach header → refresh
  - [ ] Test 401 handling → auto redirect to login
- [ ] **API Documentation cập nhật**
  - [ ] Cập nhật Swagger docs với tất cả endpoints mới (validation, upload, search)
  - [ ] Thêm ví dụ request/response cho Frontend team
  - [ ] Tạo hướng dẫn tích hợp Frontend (`docs/FRONTEND_INTEGRATION.md`)

#### Ngày 21 (27 tháng 2, 2026): Dịch Vụ Email & Password Reset

- [ ] Cài đặt `nodemailer`
- [ ] Tạo `src/services/email.service.ts`
  - [ ] Cấu hình SMTP (Gmail/Mailtrap cho dev)
  - [ ] Email templates (HTML):
    - [ ] Email chào mừng khi đăng ký
    - [ ] Email đặt lại mật khẩu (với token link)
- [ ] Implement password reset flow:
  - [ ] POST /v1/api/forgot-password — Gửi email reset
  - [ ] POST /v1/api/reset-password — Reset password với token
  - [ ] Tạo `resetToken` field trong User model (hashed, TTL 1 giờ)

---

### Tuần 5 - Real-time & Hoàn Thiện

#### Ngày 22-23 (28 tháng 2 - 1 tháng 3, 2026): WebSocket Real-time

- [ ] Cài đặt `socket.io`
- [ ] Thiết lập WebSocket server tích hợp với Express
- [ ] Xác thực WebSocket connections (verify JWT on handshake)
- [ ] Các sự kiện real-time:
  - [ ] `notification:new` — Push notification mới tới user
  - [ ] `post:liked` — Realtime like count update
  - [ ] `comment:new` — Comment mới trên post đang xem
  - [ ] `post:views` — Live view count
- [ ] Room management: mỗi user join room `user:{userId}`
- [ ] Tích hợp vào NotificationService — emit event sau khi tạo notification

#### Ngày 24-26 (2-4 tháng 3, 2026): Polish, Database Seeding & Deploy Prep

- [ ] **Database Seeding Script** (`scripts/seed.ts`)
  - [ ] Tạo admin account mặc định
  - [ ] Seed categories (Technology, Lifestyle, Business, Education, Health, Entertainment)
  - [ ] Tạo sample posts, comments, likes cho testing
- [ ] **Health Check Endpoint**
  - [ ] GET /v1/api/health — Server status, DB connection, Kafka status
- [ ] **Final Integration Testing**
  - [ ] Full flow test: Frontend ↔ Backend ↔ DB ↔ Kafka
  - [ ] Performance baseline: response times cho các endpoints chính
- [ ] **Deployment Preparation**
  - [ ] Dockerfile cho Backend
  - [ ] Environment variables documentation
  - [ ] Production build script

---

## 📦 Tính Năng Bổ Sung (Backlog - Cải Tiến Tương Lai)

### Tính Năng User

- [ ] Xác thực email (email verification on signup)
- [ ] Xác thực hai yếu tố (2FA với TOTP)
- [ ] Bookmark/lưu posts của user
- [ ] Bảng tin hoạt động user (activity feed)
- [ ] OAuth2 login (Google, GitHub)

### Tính Năng Post

- [ ] Tự động lưu bản nháp post (auto-save draft)
- [ ] Lên lịch post (scheduled publishing)
- [ ] Hệ thống tags cho post (many-to-many)
- [ ] Lịch sử chỉnh sửa/phiên bản post (revision history)
- [ ] Gợi ý bài viết liên quan (related posts by category/tags)
- [ ] Series/bộ sưu tập bài viết

### Kiểm Duyệt Nội Dung

- [ ] Hàng đợi kiểm duyệt của Admin (moderation queue)
- [ ] Lọc nội dung tự động (profanity filter, spam detection)
- [ ] Hệ thống cấm user (ban/suspend system)

### Phân Tích Nâng Cao

- [ ] Theo dõi hành vi user chi tiết (user analytics)
- [ ] Export statistics ra CSV/Excel
- [ ] Scheduled reports (weekly email digest)

---

## 🧪 Danh Sách Kiểm Tra Testing

### Unit Tests

- [x] User service methods (user.service.test.ts — 759 dòng)
- [ ] Access service methods
- [ ] Post service methods
- [ ] Comment service methods
- [ ] Category service methods
- [ ] Like/Share service methods
- [ ] Statistics service methods
- [ ] Notification service methods
- [ ] Authorization middleware functions
- [ ] Validation middleware functions

### Integration Tests

- [x] User routes (user.routes.test.ts — 613 dòng)
- [ ] Authentication flow (register → login → refresh → logout)
- [ ] Authorization flow (admin vs user vs poster)
- [ ] Post CRUD + engagement
- [ ] Comment CRUD + nested replies
- [ ] Category CRUD
- [ ] Notification CRUD

### End-to-End Tests

- [x] Notification E2E (notification.e2e.test.ts)
- [x] Kafka producer/consumer (kafka-\*.test.ts)
- [ ] Full user journey: signup → create post → get engagement → notifications
- [ ] Admin workflow: manage users → manage categories → view statistics

### Performance Tests

- [ ] Load testing với Artillery hoặc k6
- [ ] Database query performance benchmarks
- [ ] API response time monitoring
- [ ] Memory leak detection (long-running tests)

---

## 📝 Danh Sách Kiểm Tra Tài Liệu

- [x] Tài liệu API với tất cả endpoints (Swagger + API_Documentation.md)
- [x] Schemas của các database models (ERD_Blog_System.md)
- [x] Admin role management docs (ADMIN_ROLE_MANAGEMENT_IMPLEMENTATION_GUIDE.md)
- [x] Authorization guide (AUTHORIZATION_GUIDE.md)
- [x] Token version testing (TOKEN_VERSION_TESTING.md)
- [ ] Hướng dẫn thiết lập và cài đặt (README/SETUP.md)
- [ ] Hướng dẫn tích hợp frontend
- [ ] Tài liệu code (JSDoc comments cho public APIs)
- [ ] Hướng dẫn deployment

---

## Danh Sách Kiểm Tra Triển Khai

### Trước Khi Triển Khai

- [ ] Cấu hình biến môi trường production
- [ ] Database seeding script
- [ ] Production build + test
- [ ] Security audit (dependencies, headers, input validation)
- [ ] Performance baseline

### Triển Khai

- [ ] Dockerfile + docker-compose.prod.yml
- [ ] MongoDB Atlas (cloud database) hoặc self-hosted
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] SSL/TLS certificates
- [ ] PM2 process manager
- [ ] Error tracking (Sentry)

### Sau Khi Triển Khai

- [ ] Smoke testing trong production
- [ ] Monitoring setup (logs, performance, uptime)
- [ ] Thiết lập alerts cho critical errors
- [ ] Cập nhật docs với production URLs

---

## 📊 Theo Dõi Tiến Độ

**Tiến Độ Tuần 1 (Ngày 1-8):** 100% ✅

- ✅ Ngày 1 (5/2): Quản Lý User - HOÀN THÀNH
- ✅ Ngày 2 (8/2): Admin Role Management - HOÀN THÀNH
- ✅ Ngày 3 (9/2): Quản Lý Category - HOÀN THÀNH
- ✅ Ngày 4 (10/2): Quản Lý Post (Phần 1) - HOÀN THÀNH
- ✅ Ngày 5 (11/2): Quản Lý Post (Phần 2) - Likes & Shares - HOÀN THÀNH
- ✅ Ngày 6 (12-13/2): Quản Lý Comment - HOÀN THÀNH
- ✅ Ngày 7 (13/2): Hệ Thống Notification + Kafka - HOÀN THÀNH
- ✅ Ngày 8 (14/2): Thống Kê & Admin Dashboard - HOÀN THÀNH

**Tiến Độ Tuần 2 (Ngày 9-11):** 0% → Đang tiến hành

- 🔄 Ngày 9 (15/2): Input Validation & Hoàn Thiện Middleware
- Ngày 10 (16/2): Xử Lý Lỗi & Structured Logging
- Ngày 11 (17/2): Testing & QA

**Giai Đoạn 2 (Tuần 3-5):** Chưa bắt đầu

- Ngày 12-16 (18-22/2): Caching, DB Optimization, Rate Limiting
- Ngày 17-21 (23-27/2): Search, Upload, Frontend Integration, Email
- Ngày 22-26 (28/2-4/3): WebSocket, Seeding, Deploy Prep

---

## 💡 Ghi Chú

### Thực Hành Tốt Nhất Khi Phát Triển

1. **Commit thường xuyên** với thông điệp rõ ràng, mô tả
2. **Test từng tính năng** trước khi chuyển sang tính năng tiếp theo
3. **Cập nhật tài liệu** khi bạn triển khai tính năng
4. **Code review** code của chính bạn trước khi commit
5. **Xử lý lỗi một cách uyển chuyển** với thông báo ý nghĩa
6. **Validate inputs** trên tất cả endpoints
7. **Sử dụng TypeScript types** một cách đúng đắn
8. **Giữ services gọn gàng** - chỉ chứa business logic
9. **Giữ controllers gọn gàng** - chỉ xử lý request/response
10. **Tuân theo nguyên tắc DRY** - Don't Repeat Yourself

### Quy Trình Làm Việc Hàng Ngày

1. Bắt đầu với việc xem lại công việc ngày hôm trước
2. Cập nhật file TODO này với tiến độ
3. Triển khai các tính năng đã lên kế hoạch
4. Viết tests cho tính năng mới
5. Cập nhật tài liệu API nếu cần
6. Commit và push các thay đổi
7. Lên kế hoạch cho công việc ngày tiếp theo

### Ghi Chú Kỹ Thuật

- **Authorization middleware** đã triển khai đầy đủ 8 functions, chỉ `checkRoles()` chưa sử dụng trong route nào
- **Comment/Post ownership** hiện check ở service layer, cần chuyển lên middleware layer cho consistency
- **Error status codes** có bug: `BadRequestError` = 403 (phải 400), `ConflictRequestError` = 403 (phải 409)
- **Test coverage = 0%** mặc dù có 5 test files — cần debug Jest ESM configuration
- **Kafka** đã tích hợp cho notification system (producer + consumer)
- **Swagger** đã có tại `/api-docs`

---

**Lần Cập Nhật Cuối:** 15 tháng 2, 2026  
**Trạng Thái Dự Án:** Đang Phát Triển Tích Cực — Giai đoạn 1 gần hoàn thành  
**Mục Tiêu Hoàn Thành:** 4 tháng 3, 2026

**Ghi Chú Cập Nhật:** Ngày 1-8 đã hoàn thành tất cả core features (Auth, User, Admin, Category, Post, Likes/Shares, Comment, Notification+Kafka, Statistics). Ngày 9 tập trung vào input validation — tính năng quan trọng còn thiếu. Authorization middleware đã có sẵn từ trước.
