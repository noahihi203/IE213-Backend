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

### Ngày 9 (15 tháng 2, 2026) - Middleware & Phân Quyền

**Độ ưu tiên: CAO**

#### Công Việc (4-6 giờ)

- [ ] Tạo `src/middleware/authorization.ts`
  - [ ] checkRole middleware (cho kiểm tra role admin/author)
  - [ ] checkPostOwnership middleware (xác minh user sở hữu post)
  - [ ] checkCommentOwnership middleware (xác minh user sở hữu comment)

- [ ] Tạo `src/middleware/validation.ts`
  - [ ] validateUserInput (cho đăng ký/cập nhật user)
  - [ ] validatePostInput (cho tạo/cập nhật post)
  - [ ] validateCommentInput (cho tạo/cập nhật comment)
  - [ ] validateCategoryInput (cho tạo/cập nhật category)

- [ ] Cập nhật tất cả routes để sử dụng middleware mới
  - [ ] Áp dụng kiểm tra role cho admin endpoints
  - [ ] Áp dụng kiểm tra ownership cho update/delete endpoints
  - [ ] Áp dụng input validation cho tất cả POST/PUT endpoints

- [ ] Testing
  - [ ] Test authorization middleware với các roles khác nhau
  - [ ] Test xác minh ownership
  - [ ] Test validation với các inputs không hợp lệ

**Thời gian ước tính: 4-6 giờ**

---

### Ngày 10 (16 tháng 2, 2026) - Xử Lý Lỗi & Logging

**Độ ưu tiên: TRUNG BÌNH**

#### Công Việc (4-5 giờ)

- [ ] Cải thiện xử lý lỗi
  - [ ] Rà soát tất cả service methods cho việc throw error đúng cách
  - [ ] Đảm bảo các thông báo lỗi nhất quán
  - [ ] Thêm custom error classes nếu cần (đã có một số trong error.response.ts)

- [ ] Thêm logging system
  - [ ] Cài đặt winston hoặc pino logger
  - [ ] Tạo logger configuration
  - [ ] Thêm logging vào tất cả services:
    - [ ] Info logs cho các thao tác thành công
    - [ ] Error logs với stack traces
    - [ ] Debug logs cho development
  - [ ] Log tất cả incoming requests (middleware)
  - [ ] Log database queries (nếu cần)

- [ ] Tạo cấu trúc log file
  - [ ] File riêng cho errors, combined, và exceptions
  - [ ] Cấu hình log rotation

**Thời gian ước tính: 4-5 giờ**

---

### Ngày 11 (17 tháng 2, 2026) - Testing & Kiểm Tra Chất Lượng

**Độ ưu tiên: CAO**

#### Buổi Sáng (4-5 giờ)

- [ ] Hoàn thành unit tests
  - [ ] Access service tests
  - [ ] User service tests
  - [ ] Post service tests
  - [ ] Comment service tests
  - [ ] Category service tests
  - [ ] Notification service tests

#### Buổi Chiều (4-5 giờ)

- [ ] Integration tests
  - [ ] End-to-end user flow (đăng ký → đăng nhập → tạo post → comment)
  - [ ] Authentication flow tests
  - [ ] Authorization tests (role-based access)
  - [ ] Engagement flow (like → comment → share)

- [ ] API testing với Postman
  - [ ] Tạo Postman collection toàn diện
  - [ ] Test tất cả endpoints với dữ liệu hợp lệ
  - [ ] Test các trường hợp lỗi
  - [ ] Test lỗi authorization
  - [ ] Export collection cho tài liệu

**Thời gian ước tính: 8-10 giờ**

---

## 🎯 Giai Đoạn 2 - Tính Năng Nâng Cao (Tuần 3+)

### Tuần 3 - Hiệu Suất & Tối Ư u Hóa

#### Ngày 12-13 (18-19 tháng 2, 2026): Caching

- [ ] Cài đặt và cấu hình Redis
- [ ] Triển khai caching cho:
  - [ ] Trending posts
  - [ ] Danh sách categories
  - [ ] Dữ liệu user profile
  - [ ] Số lượng view của post
- [ ] Chiến lược cache invalidation

#### Ngày 14-15 (20-21 tháng 2, 2026): Tối Ưu Hóa Database

- [ ] Thêm indexes cho các fields thường xuyên query
- [ ] Tối ưu hóa aggregation queries cho statistics
- [ ] Triển khai database query profiling
- [ ] Thêm database connection pooling
- [ ] Tối ưu hóa populate operations (chọn các fields cụ thể)

#### Ngày 16 (22 tháng 2, 2026): Rate Limiting

- [ ] Cài đặt express-rate-limit
- [ ] Triển khai rate limiting:
  - [ ] Giới hạn khác nhau cho authenticated vs anonymous
  - [ ] Giới hạn cao hơn cho admin users
  - [ ] Giới hạn cụ thể cho các endpoints tốn nhiều tài nguyên
- [ ] Thêm rate limit headers vào responses

---

### Tuần 4 - Tính Năng Nâng Cao

#### Ngày 17-18 (23-24 tháng 2, 2026): Chức Năng Tìm Kiếm

- [ ] Triển khai full-text search cho posts
  - [ ] MongoDB text indexes
  - [ ] Tìm kiếm trong title, content, excerpt
  - [ ] Search relevance scoring
- [ ] Bộ lọc tìm kiếm nâng cao
  - [ ] Khoảng thời gian
  - [ ] Nhiều categories
  - [ ] Hỗ trợ tags
- [ ] Highlighting kết quả tìm kiếm
- [ ] Gợi ý tìm kiếm/autocomplete

#### Ngày 19-20 (25-26 tháng 2, 2026): Upload File

- [ ] Thiết lập hệ thống upload file
  - [ ] Cài đặt multer
  - [ ] Cấu hình storage (local hoặc cloud)
  - [ ] Validation ảnh (kích thước, định dạng)
  - [ ] Tối ưu hóa ảnh (thư viện sharp)
- [ ] Endpoints:
  - [ ] POST /v1/api/upload/image
  - [ ] POST /v1/api/upload/avatar
  - [ ] DELETE /v1/api/upload/:fileId
- [ ] Cập nhật upload avatar cho user
- [ ] Cập nhật upload cover image cho post

#### Ngày 21 (27 tháng 2, 2026): Dịch Vụ Email

- [ ] Thiết lập email service (NodeMailer)
- [ ] Email templates:
  - [ ] Email chào mừng khi đăng ký
  - [ ] Email đặt lại mật khẩu
  - [ ] Email tổng hợp thông báo
- [ ] Email queue system (tùy chọn: Bull + Redis)

---

### Tuần 5 - Tính Năng Real-time & Tích Hợp Frontend

#### Ngày 22-23 (28 tháng 2 - 1 tháng 3, 2026): Triển Khai WebSocket

- [ ] Cài đặt socket.io
- [ ] Thiết lập WebSocket server
- [ ] Các sự kiện real-time:
  - [ ] Thông báo mới
  - [ ] Post được like
  - [ ] Comment mới
  - [ ] Theo dõi lượt view post
- [ ] Xác thực cho WebSocket connections
- [ ] Quản lý room (rooms cụ thể cho từng user)

#### Ngày 24-26 (2-4 tháng 3, 2026): Hỗ Trợ Tích Hợp Frontend

- [ ] Rà soát cấu hình CORS
- [ ] Test API client của Frontend
- [ ] Sửa các vấn đề tích hợp
- [ ] Cập nhật tài liệu API với ví dụ frontend
- [ ] Tạo hướng dẫn tích hợp frontend

---

## 📦 Tính Năng Bổ Sung (Cải Tiến Tương Lai)

### Tính Năng User

- [ ] Chức năng đặt lại mật khẩu
- [ ] Xác thực email
- [ ] Xác thực hai yếu tố (2FA)
- [ ] Hệ thống follow/unfollow user
- [ ] Bookmark/lưu posts của user
- [ ] Bảng tin hoạt động user

### Tính Năng Post

- [ ] Tự động lưu bản nháp post
- [ ] Lên lịch post (đăng vào thời gian cụ thể)
- [ ] Hệ thống tags cho post
- [ ] Lịch sử chỉnh sửa/phiên bản post
- [ ] Gợi ý bài viết liên quan
- [ ] Series/bộ sưu tập bài viết

### Kiểm Duyệt Nội Dung

- [ ] Hệ thống báo cáo nội dung
- [ ] Hàng đợi kiểm duyệt của Admin
- [ ] Lọc nội dung tự động (tục tịu, spam)
- [ ] Hệ thống cấm user

### Phân Tích

- [ ] Tích hợp Google Analytics
- [ ] Theo dõi hành vi user chi tiết
- [ ] Framework A/B testing
- [ ] Theo dõi sự kiện tùy chỉnh

---

## 🧪 Danh Sách Kiểm Tra Testing

### Unit Tests

- [ ] Tất cả các methods của service
- [ ] Tất cả các methods của controller
- [ ] Các functions middleware
- [ ] Các functions utility

### Integration Tests

- [ ] Authentication flow
- [ ] Kiểm tra Authorization
- [ ] Các thao tác CRUD cho tất cả resources
- [ ] Các thao tác quan hệ (likes, comments, v.v.)

### End-to-End Tests

- [ ] Hành trình user hoàn chỉnh
- [ ] Quy trình làm việc của Admin
- [ ] Các kịch bản xử lý lỗi

### Performance Tests

- [ ] Load testing với nhiều users đồng thời
- [ ] Hiệu suất database query
- [ ] Thời gian phản hồi API
- [ ] Phát hiện memory leak

---

## 📝 Danh Sách Kiểm Tra Tài Liệu

- [x] Tài liệu API với tất cả endpoints
- [x] Schemas của các database models
- [ ] Hướng dẫn thiết lập và cài đặt
- [ ] Hướng dẫn cấu hình môi trường
- [ ] Hướng dẫn triển khai
- [ ] Hướng dẫn tích hợp frontend
- [ ] Export Postman collection
- [ ] Tài liệu code (JSDoc comments)
- [ ] Tài liệu kiến trúc
- [ ] Hướng dẫn thực hành bảo mật tốt nhất

---

## Danh Sách Kiểm Tra Triển Khai

### Trước Khi Triển Khai

- [ ] Cấu hình biến môi trường
- [ ] Scripts migration cho database
- [ ] Scripts seeding cho database
- [ ] Tối ưu hóa build
- [ ] Kiểm toán bảo mật
- [ ] Đánh giá hiệu suất

### Triển Khai

- [ ] Chọn nhà cung cấp hosting (AWS, Heroku, DigitalOcean, v.v.)
- [ ] Thiết lập MongoDB Atlas (cloud database)
- [ ] Cấu hình biến môi trường trên server
- [ ] Thiết lập CI/CD pipeline (GitHub Actions, v.v.)
- [ ] Cấu hình chứng chỉ SSL/TLS
- [ ] Thiết lập giám sát (PM2, New Relic, v.v.)
- [ ] Thiết lập theo dõi lỗi (Sentry, v.v.)
- [ ] Cấu hình sao lưu tự động

### Sau Khi Triển Khai

- [ ] Smoke testing trong production
- [ ] Giám sát logs và errors
- [ ] Giám sát hiệu suất
- [ ] Thiết lập cảnh báo cho các vấn đề nghiêm trọng
- [ ] Cập nhật tài liệu với URLs production

---

## 📊 Theo Dõi Tiến Độ

**Tiến Độ Tuần 1:** 14.3% (1/7 ngày hoàn thành)

- ✅ Ngày 1 (5/2): Quản Lý User - HOÀN THÀNH
- Ngày 2 (8/2): Admin Role Management
- Ngày 3 (9/2): Quản Lý Category
- Ngày 4 (10/2): Quản Lý Post (Phần 1)
- Ngày 5 (11/2): Quản Lý Post (Phần 2)
- Ngày 6 (12/2): Quản Lý Comment
- Ngày 7 (13/2): Hệ Thống Notification
- Ngày 8 (14/2): Thống Kê & Admin

**Tiến Độ Tuần 2:** 0%

- Ngày 9 (15/2): Middleware & Phân Quyền
- Ngày 10 (16/2): Xử Lý Lỗi & Logging
- Ngày 11 (17/2): Testing & QA

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

---

**Lần Cập Nhật Cuối:** 7 tháng 2, 2026  
**Trạng Thái Dự Án:** Đang Phát Triển Tích Cực  
**Mục Tiêu Hoàn Thành:** 4 tháng 3, 2026 (điều chỉnh do trễ 2 ngày)

**Ghi Chú Cập Nhật:** Đã dời lịch trình 2 ngày do bỏ lỡ ngày 6-7/2. Task tiếp theo là Admin Role Management vào ngày 8/2.
