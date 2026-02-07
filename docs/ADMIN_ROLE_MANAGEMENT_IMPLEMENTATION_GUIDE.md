# Hướng Dẫn Triển Khai Admin Role Management System

**Ngày tạo:** 7 tháng 2, 2026  
**Mục đích:** Xây dựng hệ thống bảo vệ và quản lý vai trò Admin an toàn

---

## 📋 Tổng Quan

Hệ thống Admin Role Management đảm bảo rằng:

- Luôn có ít nhất 1 admin hoạt động trong hệ thống
- Không vượt quá số lượng admin tối đa cho phép
- Admin không thể tự hạ cấp vai trò của chính mình
- Super Admin không thể bị hạ cấp bởi admin thường
- Admin không thể thay đổi vai trò của admin khác (trừ Super Admin)

---

## 🎯 Phần 1: Admin Configuration & Constants

### 1.1. Tạo File `src/config/admin.config.ts`

**Mục đích:** Tập trung các hằng số cấu hình admin để dễ quản lý và thay đổi

#### Các Constants Cần Tạo:

##### `MIN_ACTIVE_ADMINS`

- **Giá trị mặc định:** 1
- **Ý nghĩa:** Số lượng admin tối thiểu phải có trong hệ thống
- **Lý do:** Đảm bảo luôn có ít nhất 1 admin để quản lý hệ thống
- **Sử dụng:** Kiểm tra trước khi hạ cấp một admin

```typescript
// Ví dụ logic sử dụng:
// - Đếm số admin hiện tại đang active (isActive = true, role = 'admin')
// - Nếu số lượng <= MIN_ACTIVE_ADMINS, không cho phép hạ cấp
```

##### `MAX_ACTIVE_ADMINS`

- **Giá trị mặc định:** 5
- **Ý nghĩa:** Số lượng admin tối đa cho phép trong hệ thống
- **Lý do:** Giới hạn số lượng admin để dễ quản lý và bảo mật
- **Sử dụng:** Kiểm tra trước khi thăng cấp user lên admin

```typescript
// Ví dụ logic sử dụng:
// - Đếm số admin hiện tại đang active
// - Nếu số lượng >= MAX_ACTIVE_ADMINS, không cho phép thăng cấp thêm
```

##### `SUPER_ADMIN_ID`

- **Giá trị:** ID của admin đầu tiên trong hệ thống (có thể là string hoặc null ban đầu)
- **Ý nghĩa:** ID của Super Admin - không thể bị hạ cấp
- **Lý do:** Đảm bảo luôn có 1 admin có quyền cao nhất
- **Sử dụng:** Kiểm tra trước khi thay đổi role của user

```typescript
// Ví dụ logic sử dụng:
// - Khi thay đổi role, kiểm tra nếu userId === SUPER_ADMIN_ID
// - Nếu đúng, throw error không cho phép thay đổi
// - Có thể lưu trong database hoặc environment variable
```

#### Các Kiểu Viết Config Khuyến Nghị:

**Option 1: Simple Constants (Đơn giản nhất)**

```typescript
export const MIN_ACTIVE_ADMINS = 1;
export const MAX_ACTIVE_ADMINS = 5;
export const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || null;
```

**Option 2: Object Config (Tổ chức tốt hơn)**

```typescript
export const adminConfig = {
  minActiveAdmins: 1,
  maxActiveAdmins: 5,
  superAdminId: process.env.SUPER_ADMIN_ID || null,
  // Có thể mở rộng thêm:
  protectionEnabled: true,
  autoPromoteFirstUser: true,
};
```

**Option 3: Environment-Based (Linh hoạt nhất)**

```typescript
export const adminConfig = {
  minActiveAdmins: parseInt(process.env.MIN_ACTIVE_ADMINS || "1"),
  maxActiveAdmins: parseInt(process.env.MAX_ACTIVE_ADMINS || "5"),
  superAdminId: process.env.SUPER_ADMIN_ID || null,
};
```

### 1.2. Cập Nhật User Model (Tùy Chọn)

**File:** `src/models/user.model.ts`

#### Thêm Field `isSuperAdmin`

**Mục đích:** Đánh dấu user là Super Admin trong database

**Thông tin field:**

- **Type:** Boolean
- **Default:** false
- **Indexed:** Có (để query nhanh)
- **Immutable:** Nên được bảo vệ khỏi cập nhật trực tiếp

**Schema definition:**

```typescript
{
  isSuperAdmin: {
    type: Boolean,
    default: false,
    index: true
  }
}
```

#### Logic "First Admin Becomes Super Admin"

**Cách triển khai:**

1. **Trong Service đăng ký (access.service.ts):**
   - Sau khi tạo user mới thành công
   - Kiểm tra: Đếm số user có role = 'admin' trong database
   - Nếu count === 0 (user này là admin đầu tiên):
     - Tự động set `role: 'admin'`
     - Set `isSuperAdmin: true`
     - Lưu `SUPER_ADMIN_ID` (có thể vào database hoặc env)

2. **Pseudo logic:**

```
AFTER creating new user:
  IF user.role === 'admin':
    existingAdminCount = await User.countDocuments({ role: 'admin' })
    IF existingAdminCount === 1:  // Chỉ có user vừa tạo
      user.isSuperAdmin = true
      await user.save()
      // Lưu SUPER_ADMIN_ID vào config hoặc database
```

**Lưu ý quan trọng:**

- Chỉ admin đầu tiên mới được set `isSuperAdmin = true`
- Các admin sau đó sẽ có `isSuperAdmin = false`
- Super Admin không thể bị xóa field này thông qua API

---

## 🛡️ Phần 2: Enhanced Authorization Rules

### 2.1. Cập Nhật File `src/middleware/authorization.ts`

**Mục đích:** Thêm các middleware bảo vệ cho thao tác thay đổi role

### Middleware 1: `checkNotSelfDemotion`

**Mục đích:** Ngăn admin tự hạ cấp chính mình

**Logic:**

```
INPUT: req.user (admin đang đăng nhập), req.params.userId (user bị thay đổi)
PROCESS:
  1. Lấy userId từ params (user mục tiêu)
  2. Lấy current user ID từ req.user
  3. Lấy newRole từ req.body

  4. IF userId === currentUserId:  // Đang tự thay đổi chính mình
       IF currentUser.role === 'admin' AND newRole !== 'admin':
         THROW ERROR "Cannot demote yourself"
```

**Khi sử dụng:**

- Áp dụng cho route `PUT /v1/api/users/:userId/role`
- Đặt trước controller handler
- Chỉ kiểm tra khi user đang thay đổi role của chính mình

**Error Response:**

```json
{
  "status": 403,
  "message": "Admins cannot demote themselves. Another admin must change your role.",
  "code": "SELF_DEMOTION_FORBIDDEN"
}
```

---

### Middleware 2: `checkSuperAdminProtection`

**Mục đích:** Bảo vệ Super Admin khỏi bị thay đổi role

**Logic:**

```
INPUT: req.params.userId (user bị thay đổi)
PROCESS:
  1. Lấy userId từ params
  2. Query user từ database

  3. IF user.isSuperAdmin === true:
       THROW ERROR "Cannot modify Super Admin role"

  // Hoặc nếu sử dụng SUPER_ADMIN_ID từ config:
  4. IF userId === SUPER_ADMIN_ID:
       THROW ERROR "Cannot modify Super Admin role"
```

**Khi sử dụng:**

- Áp dụng cho route `PUT /v1/api/users/:userId/role`
- Đặt trước `checkNotSelfDemotion`
- Kiểm tra trước mọi middleware khác

**Error Response:**

```json
{
  "status": 403,
  "message": "Super Admin role cannot be changed. This user has permanent admin privileges.",
  "code": "SUPER_ADMIN_PROTECTED"
}
```

---

### Middleware 3: `checkAdminToAdminPermission`

**Mục đích:** Ngăn admin thường thay đổi role của admin khác

**Logic:**

```
INPUT: req.user (admin đang đăng nhập), req.params.userId (user mục tiêu)
PROCESS:
  1. Lấy target user từ database
  2. Lấy current user từ req.user

  3. IF targetUser.role === 'admin':  // Mục tiêu là admin
       IF currentUser.role === 'admin' AND NOT currentUser.isSuperAdmin:
         THROW ERROR "Only Super Admin can change other admin's role"
```

**Khi sử dụng:**

- Áp dụng cho route `PUT /v1/api/users/:userId/role`
- Đặt sau `checkSuperAdminProtection` và `checkNotSelfDemotion`
- Chỉ Super Admin mới bypass được middleware này

**Error Response:**

```json
{
  "status": 403,
  "message": "Regular admins cannot change other admin's roles. Only Super Admin has this permission.",
  "code": "INSUFFICIENT_ADMIN_PERMISSION"
}
```

---

### 2.2. Thứ Tự Middleware Trong Route

**Route:** `PUT /v1/api/users/:userId/role`

**Thứ tự áp dụng middleware:**

```
1. authentication          // Xác thực user đã đăng nhập
2. checkAdmin              // Đảm bảo user có role admin
3. checkSuperAdminProtection  // Bảo vệ Super Admin trước tiên
4. checkNotSelfDemotion    // Kiểm tra tự hạ cấp
5. checkAdminToAdminPermission // Kiểm tra quyền thay đổi admin khác
6. checkMinimumAdmins      // Đếm số admin (nếu hạ cấp)
7. checkMaximumAdmins      // Đếm số admin (nếu thăng cấp)
8. controller handler      // Xử lý logic thay đổi role
```

**Lý do thứ tự:**

- Kiểm tra authentication trước (đảm bảo user hợp lệ)
- Bảo vệ Super Admin đầu tiên (quyền cao nhất)
- Sau đó kiểm tra các quy tắc về self-demotion
- Cuối cùng kiểm tra số lượng admin (logic phức tạp nhất)

---

## 🔍 Phần 3: Middleware Kiểm Tra Số Lượng Admin

### 3.1. Middleware `checkMinimumAdmins`

**File:** `src/middleware/authorization.ts` hoặc tạo file riêng

**Mục đích:** Đảm bảo không hạ cấp admin khi đã đạt minimum

**Logic chi tiết:**

```
INPUT: req.params.userId, req.body.newRole
PROCESS:
  1. Lấy target user từ database
  2. Lấy newRole từ body

  3. IF targetUser.role === 'admin' AND newRole !== 'admin':
       // Đang muốn hạ cấp một admin

       4. Count số admin active:
          activeAdminCount = await User.countDocuments({
            role: 'admin',
            isActive: true
          })

       5. IF activeAdminCount <= MIN_ACTIVE_ADMINS:
            THROW ERROR "Cannot demote - minimum admin limit reached"

       6. ELSE: NEXT()  // Cho phép tiếp tục

  7. ELSE: NEXT()  // Không phải hạ cấp admin, bỏ qua
```

**Error Response:**

```json
{
  "status": 403,
  "message": "Cannot demote this admin. System must maintain at least 1 active admin.",
  "code": "MINIMUM_ADMINS_REQUIRED",
  "metadata": {
    "currentAdminCount": 1,
    "minimumRequired": 1
  }
}
```

---

### 3.2. Middleware `checkMaximumAdmins`

**Mục đích:** Đảm bảo không thăng cấp quá nhiều admin

**Logic chi tiết:**

```
INPUT: req.params.userId, req.body.newRole
PROCESS:
  1. Lấy target user từ database
  2. Lấy newRole từ body

  3. IF targetUser.role !== 'admin' AND newRole === 'admin':
       // Đang muốn thăng cấp lên admin

       4. Count số admin active:
          activeAdminCount = await User.countDocuments({
            role: 'admin',
            isActive: true
          })

       5. IF activeAdminCount >= MAX_ACTIVE_ADMINS:
            THROW ERROR "Cannot promote - maximum admin limit reached"

       6. ELSE: NEXT()  // Cho phép tiếp tục

  7. ELSE: NEXT()  // Không phải thăng cấp lên admin, bỏ qua
```

**Error Response:**

```json
{
  "status": 403,
  "message": "Cannot promote to admin. System has reached maximum admin limit.",
  "code": "MAXIMUM_ADMINS_REACHED",
  "metadata": {
    "currentAdminCount": 5,
    "maximumAllowed": 5
  }
}
```

---

## 🧪 Phần 4: Testing Guidelines

### 4.1. Test Minimum Admin Limit

**Test Case 1: Không cho phép hạ cấp admin cuối cùng**

```
SETUP:
  - Tạo 1 admin user (admin1)
  - Tạo 1 poster user (poster1)

TEST:
  - Login as admin1
  - Attempt: PUT /v1/api/users/{admin1._id}/role với body { newRole: 'poster' }

EXPECTED:
  - Status: 403
  - Message: "Cannot demote - minimum admin limit"
  - admin1.role vẫn là 'admin'
```

**Test Case 2: Cho phép hạ cấp khi có nhiều admin**

```
SETUP:
  - Tạo 2 admin users (admin1, admin2)

TEST:
  - Login as admin1
  - Attempt: PUT /v1/api/users/{admin2._id}/role với body { newRole: 'poster' }

EXPECTED:
  - Status: 200
  - admin2.role đã đổi thành 'poster'
  - Vẫn còn 1 admin (admin1)
```

---

### 4.2. Test Maximum Admin Limit

**Test Case 3: Không cho phép thăng cấp khi đạt max**

```
SETUP:
  - Tạo 5 admin users (MAX_ACTIVE_ADMINS = 5)
  - Tạo 1 poster user (poster1)

TEST:
  - Login as admin1
  - Attempt: PUT /v1/api/users/{poster1._id}/role với body { newRole: 'admin' }

EXPECTED:
  - Status: 403
  - Message: "Maximum admin limit reached"
  - poster1.role vẫn là 'poster'
```

**Test Case 4: Cho phép thăng cấp khi chưa đạt max**

```
SETUP:
  - Tạo 4 admin users (MAX_ACTIVE_ADMINS = 5)
  - Tạo 1 poster user (poster1)

TEST:
  - Login as admin1
  - Attempt: PUT /v1/api/users/{poster1._id}/role với body { newRole: 'admin' }

EXPECTED:
  - Status: 200
  - poster1.role đã đổi thành 'admin'
  - Tổng số admin = 5
```

---

### 4.3. Test Self-Demotion Prevention

**Test Case 5: Admin không thể tự hạ cấp**

```
SETUP:
  - Tạo 2 admin users (admin1, admin2)

TEST:
  - Login as admin1
  - Attempt: PUT /v1/api/users/{admin1._id}/role với body { newRole: 'poster' }

EXPECTED:
  - Status: 403
  - Message: "Cannot demote yourself"
  - admin1.role vẫn là 'admin'
```

---

### 4.4. Test Super Admin Protection

**Test Case 6: Không thể thay đổi role của Super Admin**

```
SETUP:
  - Tạo super admin (isSuperAdmin: true)
  - Tạo regular admin (admin1)

TEST:
  - Login as admin1
  - Attempt: PUT /v1/api/users/{superAdmin._id}/role với body { newRole: 'poster' }

EXPECTED:
  - Status: 403
  - Message: "Super Admin role cannot be changed"
  - superAdmin.role vẫn là 'admin'
  - superAdmin.isSuperAdmin vẫn là true
```

---

### 4.5. Test Admin-to-Admin Permission

**Test Case 7: Admin thường không thể thay đổi admin khác**

```
SETUP:
  - Tạo 2 regular admins (admin1, admin2)
  - admin1.isSuperAdmin = false
  - admin2.isSuperAdmin = false

TEST:
  - Login as admin1
  - Attempt: PUT /v1/api/users/{admin2._id}/role với body { newRole: 'poster' }

EXPECTED:
  - Status: 403
  - Message: "Only Super Admin can change other admin's role"
  - admin2.role vẫn là 'admin'
```

**Test Case 8: Super Admin có thể thay đổi admin khác**

```
SETUP:
  - Tạo super admin (isSuperAdmin: true)
  - Tạo regular admin (admin2)

TEST:
  - Login as superAdmin
  - Attempt: PUT /v1/api/users/{admin2._id}/role với body { newRole: 'poster' }

EXPECTED:
  - Status: 200
  - admin2.role đã đổi thành 'poster'
```

---

## 📝 Phần 5: Error Codes Mới

Cập nhật các error codes sau vào hệ thống:

| Error Code                      | HTTP Status | Message                                  | Khi nào throw                       |
| ------------------------------- | ----------- | ---------------------------------------- | ----------------------------------- |
| `MINIMUM_ADMINS_REQUIRED`       | 403         | Cannot demote - minimum admin limit      | Khi hạ cấp admin và số admin <= MIN |
| `MAXIMUM_ADMINS_REACHED`        | 403         | Cannot promote - maximum admin limit     | Khi thăng cấp và số admin >= MAX    |
| `SELF_DEMOTION_FORBIDDEN`       | 403         | Cannot demote yourself                   | Admin tự hạ cấp chính mình          |
| `SUPER_ADMIN_PROTECTED`         | 403         | Cannot modify Super Admin role           | Thay đổi role của Super Admin       |
| `INSUFFICIENT_ADMIN_PERMISSION` | 403         | Only Super Admin can change other admins | Admin thường đổi admin khác         |

**File cần cập nhật:**

- `src/core/error.response.ts` - Thêm các error class mới
- `src/utils/statusCodes.ts` - Thêm status codes nếu cần
- `docs/API_Documentation.md` - Document các error codes

---

## 📚 Phần 6: API Documentation Updates

### Endpoint: `PUT /v1/api/users/:userId/role`

**Cập nhật phần Error Responses:**

```markdown
#### Error Responses

##### 403 Forbidden - Minimum Admins Required

Khi cố gắng hạ cấp admin cuối cùng trong hệ thống.

Response:
{
"status": 403,
"message": "Cannot demote this admin. System must maintain at least 1 active admin.",
"code": "MINIMUM_ADMINS_REQUIRED"
}

##### 403 Forbidden - Maximum Admins Reached

Khi cố gắng thăng cấp user lên admin khi đã đạt giới hạn.

Response:
{
"status": 403,
"message": "Cannot promote to admin. System has reached maximum admin limit.",
"code": "MAXIMUM_ADMINS_REACHED"
}

##### 403 Forbidden - Self Demotion

Khi admin cố gắng tự hạ cấp chính mình.

Response:
{
"status": 403,
"message": "Admins cannot demote themselves.",
"code": "SELF_DEMOTION_FORBIDDEN"
}

##### 403 Forbidden - Super Admin Protected

Khi cố gắng thay đổi role của Super Admin.

Response:
{
"status": 403,
"message": "Super Admin role cannot be changed.",
"code": "SUPER_ADMIN_PROTECTED"
}

##### 403 Forbidden - Insufficient Admin Permission

Khi admin thường cố thay đổi role của admin khác.

Response:
{
"status": 403,
"message": "Only Super Admin can change other admin's roles.",
"code": "INSUFFICIENT_ADMIN_PERMISSION"
}
```

---

## 🎯 Phần 7: Implementation Checklist

### Phase 1: Configuration (30 phút)

- [ ] Tạo `src/config/admin.config.ts`
- [ ] Định nghĩa `MIN_ACTIVE_ADMINS = 1`
- [ ] Định nghĩa `MAX_ACTIVE_ADMINS = 5`
- [ ] Định nghĩa `SUPER_ADMIN_ID` (lấy từ env)
- [ ] Thêm config vào `.env.example`

### Phase 2: User Model Update (30 phút)

- [ ] Thêm field `isSuperAdmin` vào User schema
- [ ] Thêm index cho field mới
- [ ] Cập nhật User interface/type
- [ ] Test migration với data cũ

### Phase 3: Access Service Update (1 giờ)

- [ ] Thêm logic "first admin becomes super admin" vào signUp
- [ ] Test đăng ký admin đầu tiên
- [ ] Test đăng ký admin thứ 2, 3...
- [ ] Verify `isSuperAdmin` được set đúng

### Phase 4: Authorization Middleware (2 giờ)

- [ ] Implement `checkSuperAdminProtection`
- [ ] Implement `checkNotSelfDemotion`
- [ ] Implement `checkAdminToAdminPermission`
- [ ] Implement `checkMinimumAdmins`
- [ ] Implement `checkMaximumAdmins`
- [ ] Test từng middleware riêng lẻ

### Phase 5: Route Integration (30 phút)

- [ ] Cập nhật route `PUT /users/:userId/role`
- [ ] Áp dụng middleware theo đúng thứ tự
- [ ] Test toàn bộ flow end-to-end

### Phase 6: Error Handling (1 giờ)

- [ ] Tạo custom error classes
- [ ] Cập nhật error response format
- [ ] Thêm error codes vào constants
- [ ] Test error messages

### Phase 7: Testing (2 giờ)

- [ ] Write unit tests cho middleware
- [ ] Write integration tests cho role change flow
- [ ] Test tất cả edge cases
- [ ] Test với Postman

### Phase 8: Documentation (1 giờ)

- [ ] Cập nhật `API_Documentation.md`
- [ ] Tạo `ADMIN_ROLE_MANAGEMENT.md` (file này)
- [ ] Thêm examples trong docs
- [ ] Update README nếu cần

**Tổng thời gian ước tính: 8-9 giờ**

---

## 💡 Best Practices & Tips

### 1. Database Queries Optimization

```typescript
// BAD: Query riêng lẻ
const user = await User.findById(userId);
const adminCount = await User.countDocuments({ role: "admin" });

// GOOD: Parallel queries
const [user, adminCount] = await Promise.all([
  User.findById(userId),
  User.countDocuments({ role: "admin", isActive: true }),
]);
```

### 2. Middleware Error Messages

- Luôn trả về message rõ ràng cho user
- Bao gồm context (số admin hiện tại, giới hạn)
- Sử dụng error codes để frontend xử lý

### 3. Logging & Audit Trail

```typescript
// Sau khi thay đổi role thành công, log lại:
logger.info("Admin role changed", {
  targetUserId: userId,
  oldRole: user.role,
  newRole: newRole,
  changedBy: req.user._id,
  timestamp: new Date(),
});
```

### 4. Environment Variables

```bash
# .env
SUPER_ADMIN_ID=507f1f77bcf86cd799439011
MIN_ACTIVE_ADMINS=1
MAX_ACTIVE_ADMINS=5
```

### 5. Testing Strategy

- Test happy path (thành công)
- Test edge cases (admin cuối, admin đầu)
- Test security (không bypass được protection)
- Test concurrent requests (2 admin hạ cấp cùng lúc)

---

## 🔐 Security Considerations

### 1. Rate Limiting

- Áp dụng rate limit cho endpoint thay đổi role
- Giới hạn: 5 requests/phút per admin user
- Ngăn brute force attacks

### 2. Audit Logging

- Log tất cả thay đổi role
- Lưu: who, what, when, IP address
- Giữ logs ít nhất 90 ngày

### 3. Super Admin Management

- Chỉ nên có 1 Super Admin
- Backup Super Admin credentials
- Document quy trình transfer Super Admin

### 4. Environment Protection

- `SUPER_ADMIN_ID` không nên hardcode
- Dùng environment variables
- Khác nhau giữa dev/staging/production

---

## 🐛 Common Pitfalls & Solutions

### Problem 1: Race Condition khi đếm admin

**Vấn đề:** 2 requests hạ cấp admin cùng lúc, bypass minimum check

**Giải pháp:**

- Sử dụng database transaction
- Lock document khi update
- Recheck count trong transaction

### Problem 2: Active vs Inactive Admin

**Vấn đề:** Quên filter `isActive: true` khi đếm

**Giải pháp:**

- Luôn query với `{ role: 'admin', isActive: true }`
- Soft delete admin vẫn giữ role nhưng isActive = false

### Problem 3: Super Admin Lost

**Vấn đề:** Super Admin bị vô tình xóa/deactivate

**Giải pháp:**

- Thêm middleware ngăn xóa Super Admin
- Backup Super Admin trong multiple places
- Có script khôi phục Super Admin

---

## 📖 Tài Liệu Tham Khảo

### Files Liên Quan

- `src/config/admin.config.ts` - Admin configuration
- `src/middleware/authorization.ts` - Authorization middleware
- `src/models/user.model.ts` - User schema
- `src/services/user.service.ts` - User business logic
- `src/controllers/user.controller.ts` - User endpoints
- `docs/API_Documentation.md` - API docs
- `docs/AUTHORIZATION_GUIDE.md` - Authorization guide

### External Resources

- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [Express Middleware Patterns](https://expressjs.com/en/guide/using-middleware.html)
- [Role-Based Access Control Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)

---

## ✅ Success Criteria

Hệ thống được coi là hoàn thành khi:

- [ ] Luôn có ít nhất 1 admin trong hệ thống
- [ ] Không thể có quá 5 admin cùng lúc
- [ ] Admin không thể tự hạ cấp chính mình
- [ ] Super Admin không thể bị thay đổi role
- [ ] Admin thường không thể thay đổi admin khác
- [ ] Super Admin có thể thay đổi mọi user (trừ chính mình nếu là demotion)
- [ ] Tất cả test cases pass
- [ ] API documentation đầy đủ
- [ ] Error responses rõ ràng và hữu ích

---

**Lưu ý cuối:** Triển khai từng phần một, test kỹ từng middleware trước khi tích hợp. Security là ưu tiên hàng đầu!
