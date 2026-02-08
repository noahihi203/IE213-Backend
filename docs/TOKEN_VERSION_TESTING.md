# Token Version Auto-Refresh - Testing Guide

## ✅ Implementation Completed

Đã implement token versioning với auto-refresh mechanism:

1. ✅ Thêm `tokenVersion` vào User model
2. ✅ Include `tokenVersion` trong JWT payload (login & signup)
3. ✅ Middleware check token version mỗi request
4. ✅ Increment `tokenVersion` khi đổi role
5. ✅ Custom error code `TOKEN_OUTDATED` cho frontend

---

## 🎬 Flow Hoạt Động

```
1. User login → Token { version: 1, role: "user" }
2. Admin đổi role → DB: tokenVersion = 2, role = "admin"
3. User click menu Admin → Request với token version: 1
4. Backend check: 1 < 2 → 401 với code: "TOKEN_OUTDATED"
5. Frontend intercept → Auto refresh token (silent)
6. Get new token { version: 2, role: "admin" }
7. Retry original request → Success ✅
8. User chỉ thấy delay ~0.5s, không bị logout
```

---

## 🧪 Testing Steps

### Step 1: Create Test User

```http
POST http://localhost:5000/v1/api/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User"
}
```

**Response:**

```json
{
  "message": "Registered OK!",
  "status": 201,
  "metadata": {
    "user": {
      "_id": "65abc...",
      "username": "testuser",
      "email": "test@example.com"
    },
    "tokens": {
      "accessToken": "eyJ...", // Contains: tokenVersion: 0, role: "user"
      "refreshToken": "eyJ..."
    }
  }
}
```

**Save accessToken để test!**

---

### Step 2: Verify Current Token

```http
GET http://localhost:5000/v1/api/users/65abc...
x-client-id: 65abc...
authorization: eyJ... (accessToken từ step 1)
```

**Response:**

```json
{
  "message": "Get user profile success!",
  "status": 200,
  "metadata": {
    "_id": "65abc...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user" // Current role
  }
}
```

---

### Step 3: Admin Change Role (Increment tokenVersion)

Login với admin account hoặc dùng MongoDB để update:

```http
PUT http://localhost:5000/v1/api/users/65abc.../role
x-client-id: <admin_id>
authorization: <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Hoặc dùng MongoDB directly:**

```javascript
db.Users.findOneAndUpdate(
  { email: "test@example.com" },
  {
    $set: { role: "admin" },
    $inc: { tokenVersion: 1 }, // 0 → 1
  },
);
```

**Response:**

```json
{
  "message": "Change user role success!",
  "status": 200,
  "metadata": {
    "_id": "65abc...",
    "role": "admin", // Changed!
    "tokenVersion": 1 // Incremented!
  }
}
```

---

### Step 4: Use Old Token (Should Get TOKEN_OUTDATED Error)

```http
GET http://localhost:5000/v1/api/users
x-client-id: 65abc...
authorization: eyJ... (old token with version: 0)
```

**Response:**

```json
{
  "status": "error",
  "code": "TOKEN_OUTDATED", // ⭐ Special code for frontend
  "message": "Token version outdated"
}
```

**Status Code:** 401 Unauthorized

---

### Step 5: Frontend Auto-Refresh Simulation

Frontend sẽ detect `code: "TOKEN_OUTDATED"` và tự động refresh:

```http
POST http://localhost:5000/v1/api/handlerRefreshToken
x-client-id: 65abc...
x-rtoken-id: eyJ... (refreshToken)
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

**Response:**

```json
{
  "message": "Get token success!",
  "status": 200,
  "metadata": {
    "user": {
      "_id": "65abc...",
      "role": "admin" // New role!
    },
    "tokens": {
      "accessToken": "eyJ...", // New token: version: 1, role: "admin"
      "refreshToken": "eyJ..."
    }
  }
}
```

---

### Step 6: Retry with New Token (Should Succeed)

```http
GET http://localhost:5000/v1/api/users
x-client-id: 65abc...
authorization: eyJ... (new token with version: 1, role: admin)
```

**Response:**

```json
{
  "message": "Get all users success!",
  "status": 200,
  "metadata": {
    "users": [...],
    "pagination": {...}
  }
}
```

**✅ Success! User giờ có quyền admin mà không cần logout!**

---

## 🎨 Frontend Implementation (Axios Interceptor)

```typescript
// src/lib/api/client.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// Response interceptor for auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for TOKEN_OUTDATED error
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_OUTDATED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        console.log("Token outdated, refreshing...");

        // Get refresh token from store
        const refreshToken = authStore.getState().refreshToken;
        const userId = authStore.getState().user?._id;

        // Call refresh token API
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/handlerRefreshToken`,
          { refreshToken },
          {
            headers: {
              "x-client-id": userId,
              "x-rtoken-id": refreshToken,
            },
          },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.metadata.tokens;

        // Update tokens in store
        authStore.getState().setTokens(accessToken, newRefreshToken);

        // Update authorization header
        originalRequest.headers["authorization"] = accessToken;

        console.log("Token refreshed, retrying request...");

        // Retry original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);

        // Refresh failed → logout user
        authStore.getState().logout();
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    // Other errors → pass through
    return Promise.reject(error);
  },
);

export default apiClient;
```

---

## 📊 Test Scenarios

### Scenario 1: Normal Flow (Token Valid)

```
User request → Token version matches DB → ✅ Pass
```

### Scenario 2: Role Changed (Token Outdated)

```
User request → Token version < DB version
→ 401 TOKEN_OUTDATED
→ Frontend auto refresh
→ Get new token
→ Retry request
→ ✅ Success
```

### Scenario 3: Refresh Token Also Outdated

```
User request → 401 TOKEN_OUTDATED
→ Try refresh → Refresh token also outdated
→ 401 again
→ Logout user
→ Redirect to login
```

### Scenario 4: Multiple Role Changes

```
Initial: version: 0, role: "user"
Change 1: version: 1, role: "author"
Change 2: version: 2, role: "admin"

Token with version: 0 → Rejected (0 < 2)
Token with version: 1 → Rejected (1 < 2)
Token with version: 2 → ✅ Accepted
```

---

## 🔍 Debugging Tips

### Check Token Payload (jwt.io)

Decode token để xem payload:

```json
{
  "userId": "65abc...",
  "email": "test@example.com",
  "role": "admin",
  "tokenVersion": 1, // Check this!
  "iat": 1707123456,
  "exp": 1707209856
}
```

### Check User in Database

```javascript
db.Users.findOne({ email: "test@example.com" }, {
  role: 1,
  tokenVersion: 1
})

// Should return:
{
  "_id": "65abc...",
  "role": "admin",
  "tokenVersion": 1
}
```

### Check Server Logs

```bash
# Should see in console:
Token version in token: 0
Token version in DB: 1
→ Token outdated error
```

---

## ✅ Success Criteria

- ✅ User login → Token chứa tokenVersion
- ✅ Admin đổi role → tokenVersion tăng lên
- ✅ Old token bị reject với code: TOKEN_OUTDATED
- ✅ Frontend auto refresh (không redirect login)
- ✅ New token có role mới và version mới
- ✅ User không nhận ra sự thay đổi (chỉ delay nhỏ)

---

## 🎯 Benefits

1. **Seamless UX**: User không bị logout khi role đổi
2. **Real-time**: Role change có hiệu lực ngay (~0.5s)
3. **Simple**: Không cần Redis, chỉ MongoDB
4. **Secure**: Token cũ bị invalidate ngay lập tức
5. **Auto-refresh**: Frontend tự động xử lý, transparent

---

## 📝 Notes

- Token expiry vẫn là 2 ngày (có thể giảm xuống nếu muốn security cao hơn)
- Refresh token cũng check tokenVersion
- Error code `TOKEN_OUTDATED` khác với `UNAUTHORIZED` thông thường
- Frontend cần implement interceptor để auto-refresh
- Chỉ increment tokenVersion khi đổi role (không phải mọi update)

---

## 🚀 Next Steps

1. Test thoroughly với Postman
2. Implement frontend interceptor
3. Test multi-device scenario
4. Consider adding audit log cho role changes
5. Monitor performance (DB query mỗi request)
