# Hệ Thống Blog IE213 - Lộ Trình Phát Triển

## Tình Trạng Hiện Tại (4 tháng 2, 2026)

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

### Ngày 1 (5 tháng 2, 2026) - Service Quản Lý User ✅ HOÀN THÀNH

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
- [ ] Tạo test file `src/tests/user.routes.test.ts`
- [ ] Viết unit tests cơ bản cho các methods của user service

**Thời gian thực tế: ~8 giờ (bao gồm token versioning & authorization system)**

---

### Ngày 2 (6 tháng 2, 2026) - Admin Role Management & Security

**Độ ưu tiên: CAO**

#### Buổi Sáng (3-4 giờ)

- [ ] **Admin Role Protection System**
  - [ ] Implement `checkMinimumAdmins` middleware
    - [ ] Query active admin count before role change
    - [ ] Prevent admin demotion if count <= minimum (e.g., 1-2 admins)
    - [ ] Custom error: `MINIMUM_ADMINS_REQUIRED`
  - [ ] Implement `checkMaximumAdmins` middleware
    - [ ] Query active admin count before role promotion
    - [ ] Prevent admin promotion if count >= maximum (e.g., 5 admins)
    - [ ] Custom error: `MAXIMUM_ADMINS_REACHED`
  - [ ] Update `updateUserRole` service method
    - [ ] Add validation for self-demotion (admin lowering own role)
    - [ ] Add validation for admin-to-admin role changes
    - [ ] Add checks using new middleware
    - [ ] Add logging for all admin role changes (audit trail)

#### Buổi Chiều (2-3 giờ)

- [ ] **Admin Configuration & Constants**
  - [ ] Create `src/config/admin.config.ts`
    - [ ] `MIN_ACTIVE_ADMINS` constant (default: 1)
    - [ ] `MAX_ACTIVE_ADMINS` constant (default: 5)
    - [ ] `SUPER_ADMIN_ID` for initial admin (cannot be demoted)
  - [ ] Update User model (optional)
    - [ ] Add `isSuperAdmin` boolean field (default: false)
    - [ ] First registered admin automatically becomes super admin

- [ ] **Enhanced Authorization Rules**
  - [ ] Update `authorization.ts`
    - [ ] Add `checkNotSelfDemotion` middleware
    - [ ] Add `checkSuperAdminProtection` middleware
    - [ ] Add `checkAdminToAdminPermission` middleware

#### Testing & Documentation

- [ ] Test admin protection scenarios
  - [ ] Test minimum admin limit enforcement
  - [ ] Test maximum admin limit enforcement
  - [ ] Test admin self-demotion prevention
  - [ ] Test super admin protection
  - [ ] Test admin changing other admin's role
- [ ] Update API documentation with new error codes
- [ ] Create `ADMIN_ROLE_MANAGEMENT.md` documentation

**Thời gian ước tính: 5-7 giờ**

---

### Ngày 3 (7 tháng 2, 2026) - Quản Lý Category

**Độ ưu tiên: CAO**

#### Buổi Sáng (3-4 giờ)

- [ ] Tạo `category.service.ts`
  - [ ] Method getAllCategories
  - [ ] Method getCategoryById
  - [ ] Method getCategoryBySlug
  - [ ] Method createCategory với tạo slug tự động
  - [ ] Method updateCategory
  - [ ] Method deleteCategory (kiểm tra các posts liên quan)
  - [ ] Method getCategoryPostCount

- [ ] Tạo `category.controller.ts`
  - [ ] getAllCategories (GET /v1/api/categories)
  - [ ] getSingleCategory (GET /v1/api/categories/:categoryId)
  - [ ] getCategoryBySlug (GET /v1/api/categories/slug/:slug)
  - [ ] createCategory (POST /v1/api/categories) - Chỉ Admin
  - [ ] updateCategory (PUT /v1/api/categories/:categoryId) - Chỉ Admin
  - [ ] deleteCategory (DELETE /v1/api/categories/:categoryId) - Chỉ Admin

#### Buổi Chiều (2-3 giờ)

- [ ] Tạo category routes trong `src/routes/category/index.ts`
  - [ ] Thiết lập tất cả category endpoints
  - [ ] Thêm authentication cho protected routes
  - [ ] Thêm admin authorization cho create/update/delete

- [ ] Đăng ký category routes vào main router

#### Testing

- [ ] Test tất cả category endpoints
- [ ] Tạo `src/tests/category.routes.test.ts`
- [ ] Seed database với categories ban đầu (Technology, Lifestyle, Business, v.v.)

**Thời gian ước tính: 5-7 giờ**

---

### Ngày 4 (8 tháng 2, 2026) - Quản Lý Post (Phần 1)

**Độ ưu tiên: CAO**

#### Buổi Sáng (4-5 giờ)

- [ ] Tạo `post.service.ts` - CRUD cơ bản
  - [ ] Method getAllPostsWithFilters (pagination, search, sort, status filter)
  - [ ] Method getPostById (kèm author và category population)
  - [ ] Method getPostBySlug
  - [ ] Method createPost với tạo slug tự động
  - [ ] Method updatePost với kiểm tra authorization
  - [ ] Method deletePost (soft delete - chuyển sang archived)
  - [ ] Method incrementViewCount

#### Buổi Chiều (3-4 giờ)

- [ ] Tạo `post.controller.ts` - Endpoints cơ bản
  - [ ] getAllPosts (GET /v1/api/posts)
  - [ ] getSinglePost (GET /v1/api/posts/:postId)
  - [ ] getPostBySlug (GET /v1/api/posts/slug/:slug)
  - [ ] createPost (POST /v1/api/posts) - Chỉ Poster/Admin
  - [ ] updatePost (PUT /v1/api/posts/:postId) - Chỉ Author/Admin
  - [ ] deletePost (DELETE /v1/api/posts/:postId) - Chỉ Author/Admin

- [ ] Tạo post routes trong `src/routes/post/index.ts`
  - [ ] Thiết lập CRUD endpoints cơ bản
  - [ ] Thêm authentication middleware
  - [ ] Thêm role-based authorization (poster/admin cho create)
  - [ ] Thêm ownership check middleware (cho update/delete)

**Thời gian ước tính: 7-9 giờ**

---

### Ngày 5 (9 tháng 2, 2026) - Quản Lý Post (Phần 2) - Likes & Shares

**Độ ưu tiên: CAO**

#### Buổi Sáng (3-4 giờ)

- [ ] Tạo `like.service.ts`
  - [ ] Method likePost (tạo like record)
  - [ ] Method unlikePost (xóa like record)
  - [ ] Method isPostLikedByUser
  - [ ] Method getPostLikesCount
  - [ ] Method likeComment
  - [ ] Method unlikeComment
  - [ ] Method isCommentLikedByUser
  - [ ] Method getCommentLikesCount

- [ ] Tạo `share.service.ts`
  - [ ] Method createShare
  - [ ] Method getPostSharesCount
  - [ ] Method getUserShares

#### Buổi Chiều (3-4 giờ)

- [ ] Mở rộng `post.service.ts` với engagement methods
  - [ ] Method getTrendingPosts (tính toán dựa trên views, likes, comments)
  - [ ] Method getPostWithEngagement (bao gồm likes, shares counts)

- [ ] Mở rộng `post.controller.ts` với engagement endpoints
  - [ ] likePost (POST /v1/api/posts/:postId/like)
  - [ ] unlikePost (DELETE /v1/api/posts/:postId/like)
  - [ ] sharePost (POST /v1/api/posts/:postId/share)
  - [ ] getTrendingPosts (GET /v1/api/posts/trending)

- [ ] Cập nhật post routes với endpoints mới

#### Testing

- [ ] Test chức năng like/unlike
- [ ] Test chức năng share
- [ ] Test thuật toán trending posts
- [ ] Tạo integration tests

**Thời gian ước tính: 6-8 giờ**

---

### Ngày 5 (9 tháng 2, 2026) - Quản Lý Comment

**Độ ưu tiên: CAO**

#### Buổi Sáng (4-5 giờ)

- [ ] Tạo `comment.service.ts`
  - [ ] Method getPostComments (với pagination, sorting)
  - [ ] Method getCommentById
  - [ ] Method createComment
  - [ ] Method createReply (parentId không null)
  - [ ] Method updateComment (với kiểm tra ownership)
  - [ ] Method deleteComment (cascade delete replies)
  - [ ] Method getCommentReplies
  - [ ] Method getCommentCount (cho post)

#### Buổi Chiều (3-4 giờ)

- [ ] Tạo `comment.controller.ts`
  - [ ] getPostComments (GET /v1/api/posts/:postId/comments)
  - [ ] createComment (POST /v1/api/posts/:postId/comments)
  - [ ] createReply (POST /v1/api/posts/:postId/comments) - với parentId
  - [ ] updateComment (PUT /v1/api/comments/:commentId)
  - [ ] deleteComment (DELETE /v1/api/comments/:commentId)
  - [ ] likeComment (POST /v1/api/comments/:commentId/like)
  - [ ] unlikeComment (DELETE /v1/api/comments/:commentId/like)
  - [ ] getCommentReplies (GET /v1/api/comments/:commentId/replies)

- [ ] Tạo comment routes trong `src/routes/comment/index.ts`

#### Testing

- [ ] Test các thao tác CRUD comment
- [ ] Test chức năng nested replies
- [ ] Test comment likes
- [ ] Tạo test file `src/tests/comment.routes.test.ts`

**Thời gian ước tính: 7-9 giờ**

---

### Ngày 6 (10 tháng 2, 2026) - Hệ Thống Notification

**Độ ưu tiên: TRUNG BÌNH**

#### Buổi Sáng (4-5 giờ)

- [ ] Tạo `notification.service.ts`
  - [ ] Method createNotification (generic)
  - [ ] Method getUserNotifications (với filters: isRead, type)
  - [ ] Method getUnreadCount
  - [ ] Method markAsRead
  - [ ] Method markAllAsRead
  - [ ] Method deleteNotification
  - [ ] Method deleteAllRead
  - [ ] Các methods kích hoạt Notification:
    - [ ] notifyOnPostLike
    - [ ] notifyOnComment
    - [ ] notifyOnCommentLike
    - [ ] notifyOnShare

#### Buổi Chiều (3-4 giờ)

- [ ] Tạo `notification.controller.ts`
  - [ ] getUserNotifications (GET /v1/api/notifications)
  - [ ] getUnreadCount (GET /v1/api/notifications/unread-count)
  - [ ] markAsRead (PUT /v1/api/notifications/:notificationId/read)
  - [ ] markAllAsRead (PUT /v1/api/notifications/read-all)
  - [ ] deleteNotification (DELETE /v1/api/notifications/:notificationId)
  - [ ] deleteAllRead (DELETE /v1/api/notifications/read)

- [ ] Tạo notification routes trong `src/routes/notification/index.ts`

- [ ] Tích hợp notification triggers vào:
  - [ ] Các thao tác like/unlike post
  - [ ] Tạo comment
  - [ ] Các thao tác like comment
  - [ ] Các thao tác share post

**Thời gian ước tính: 7-9 giờ**

---

### Ngày 7 (11 tháng 2, 2026) - Thống Kê & Admin Dashboard

**Độ ưu tiên: TRUNG BÌNH**

#### Buổi Sáng (4-5 giờ)

- [ ] Tạo `statistics.service.ts`
  - [ ] Method getDashboardStats
    - Tổng số users, posts, comments, likes, shares
    - Users/posts mới trong tuần/tháng này
    - Số lượng active users
    - Top categories
  - [ ] Method getUserStatistics
    - Xu hướng đăng ký user
    - Users theo role
    - Top contributors
    - Active vs inactive users
  - [ ] Method getPostStatistics
    - Posts theo status (published/draft/archived)
    - Tổng views, likes, comments, shares
    - Các chỉ số engagement trung bình
    - Posts theo category
    - Top posts

#### Buổi Chiều (3-4 giờ)

- [ ] Mở rộng `statistics.service.ts`
  - [ ] Method getActivityStatistics
    - Xu hướng hoạt động (likes, comments, shares theo ngày)
    - Những giờ hoạt động nhiều nhất
    - Các mẫu engagement
  - [ ] Method getCategoryStatistics
    - Posts theo từng category
    - Engagement theo từng category
    - Các chỉ số hiệu suất category

- [ ] Tạo `statistics.controller.ts`
  - [ ] getDashboardStats (GET /v1/api/admin/stats/dashboard)
  - [ ] getUserStats (GET /v1/api/admin/stats/users)
  - [ ] getPostStats (GET /v1/api/admin/stats/posts)
  - [ ] getActivityStats (GET /v1/api/admin/stats/activity)
  - [ ] getCategoryStats (GET /v1/api/admin/stats/categories)

- [ ] Tạo admin routes trong `src/routes/admin/index.ts`
  - [ ] Thêm admin-only middleware
  - [ ] Đăng ký tất cả statistics endpoints

**Thời gian ước tính: 7-9 giờ**

---

### Ngày 8 (12 tháng 2, 2026) - Middleware & Phân Quyền

**Độ ưu tiên: CAO**

#### Công Việc (4-6 giờ)

- [ ] Tạo `src/middleware/authorization.ts`
  - [ ] checkRole middleware (cho kiểm tra role admin/poster)
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

### Ngày 9 (13 tháng 2, 2026) - Xử Lý Lỗi & Logging

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

### Ngày 10 (14 tháng 2, 2026) - Testing & Kiểm Tra Chất Lượng

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

#### Ngày 11-12: Caching

- [ ] Cài đặt và cấu hình Redis
- [ ] Triển khai caching cho:
  - [ ] Trending posts
  - [ ] Danh sách categories
  - [ ] Dữ liệu user profile
  - [ ] Số lượng view của post
- [ ] Chiến lược cache invalidation

#### Ngày 13-14: Tối Ưu Hóa Database

- [ ] Thêm indexes cho các fields thường xuyên query
- [ ] Tối ưu hóa aggregation queries cho statistics
- [ ] Triển khai database query profiling
- [ ] Thêm database connection pooling
- [ ] Tối ưu hóa populate operations (chọn các fields cụ thể)

#### Ngày 15: Rate Limiting

- [ ] Cài đặt express-rate-limit
- [ ] Triển khai rate limiting:
  - [ ] Giới hạn khác nhau cho authenticated vs anonymous
  - [ ] Giới hạn cao hơn cho admin users
  - [ ] Giới hạn cụ thể cho các endpoints tốn nhiều tài nguyên
- [ ] Thêm rate limit headers vào responses

---

### Tuần 4 - Tính Năng Nâng Cao

#### Ngày 16-17: Chức Năng Tìm Kiếm

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

#### Ngày 18-19: Upload File

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

#### Ngày 20: Dịch Vụ Email

- [ ] Thiết lập email service (NodeMailer)
- [ ] Email templates:
  - [ ] Email chào mừng khi đăng ký
  - [ ] Email đặt lại mật khẩu
  - [ ] Email tổng hợp thông báo
- [ ] Email queue system (tùy chọn: Bull + Redis)

---

### Tuần 5 - Tính Năng Real-time & Tích Hợp Frontend

#### Ngày 21-22: Triển Khai WebSocket

- [ ] Cài đặt socket.io
- [ ] Thiết lập WebSocket server
- [ ] Các sự kiện real-time:
  - [ ] Thông báo mới
  - [ ] Post được like
  - [ ] Comment mới
  - [ ] Theo dõi lượt view post
- [ ] Xác thực cho WebSocket connections
- [ ] Quản lý room (rooms cụ thể cho từng user)

#### Ngày 23-25: Hỗ Trợ Tích Hợp Frontend

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

## 🚀 Danh Sách Kiểm Tra Triển Khai

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

**Tiến Độ Tuần 1:** 0% (Bắt đầu 5 tháng 2, 2026)

- Ngày 1: Quản Lý User
- Ngày 2: Quản Lý Category
- Ngày 3: Quản Lý Post (Phần 1)
- Ngày 4: Quản Lý Post (Phần 2)
- Ngày 5: Quản Lý Comment
- Ngày 6: Hệ Thống Notification
- Ngày 7: Thống Kê & Admin

**Tiến Độ Tuần 2:** 0%

- Ngày 8: Middleware & Phân Quyền
- Ngày 9: Xử Lý Lỗi & Logging
- Ngày 10: Testing & QA

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

**Lần Cập Nhật Cuối:** 4 tháng 2, 2026  
**Trạng Thái Dự Án:** Đang Phát Triển Tích Cực  
**Mục Tiêu Hoàn Thành:** 24 tháng 2, 2026 (3 tuần)
