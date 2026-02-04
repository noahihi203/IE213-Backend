# API Documentation - IE213 Blog System

## Tech Stack

**Backend**: Node.js, Express, MongoDB (Mongoose)  
**Frontend**: Next.js 14 (App Router)  
**Authentication**: RSA-based JWT (RS256)

---

## Base Configuration

**Base URL**: `http://localhost:5000/v1/api`  
**Port**: Backend runs on port 5000, Frontend on port 3000  
**Database**: MongoDB on port 10236 (Docker)

---

## Response Format

All API responses follow this standardized format:

**Success Response:**

```json
{
  "message": "Success message",
  "status": 200,
  "metadata": {
    // Response data here
  }
}
```

**Error Response:**

```json
{
  "status": 400,
  "message": "Error message description"
}
```

---

## Authentication System

### Authentication Flow

This API uses **RSA-based JWT tokens** with the following characteristics:

- **Algorithm**: RS256 (RSA + SHA-256)
- **Key Generation**: RSA key pairs (2048-bit) generated per user at signup
- **Access Token**: Expires in 2 days
- **Refresh Token**: Expires in 7 days
- **Storage**: Keys stored in `keytoken` collection with refresh token tracking

### Required Headers for Protected Routes

All protected endpoints require TWO headers:

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Example:**

```http
x-client-id: 65a1b2c3d4e5f6a7b8c9d0e1
Authorization: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 1. Authentication Endpoints

### 1.1 Register User

**Endpoint:** `POST /v1/api/register`

**Description:** Create a new user account with RSA key pair generation.

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

**Validation Rules:**

- `username`: Required, unique, alphanumeric with underscores
- `email`: Required, unique, valid email format
- `password`: Required, minimum 6 characters
- `fullName`: Required, string

**Success Response:** `201 CREATED`

```json
{
  "message": "Registered OK!",
  "status": 201,
  "metadata": {
    "code": 201,
    "metadata": {
      "user": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "username": "johndoe",
        "email": "john@example.com",
        "fullName": "John Doe"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  },
  "options": {
    "limit": 10
  }
}
```

**Error Responses:**

`400 BAD REQUEST` - Email already exists

```json
{
  "status": 400,
  "message": "Email already exists!"
}
```

`400 BAD REQUEST` - Username already exists

```json
{
  "status": 400,
  "message": "Username already exists!"
}
```

---

### 1.2 Login User

**Endpoint:** `POST /v1/api/login`

**Description:** Authenticate user and receive new token pair.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "user": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "username": "johndoe",
      "email": "john@example.com",
      "fullName": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**

`400 BAD REQUEST` - User not found

```json
{
  "status": 400,
  "message": "User not registered!"
}
```

`401 UNAUTHORIZED` - Wrong password

```json
{
  "status": 401,
  "message": "Authentication error"
}
```

---

### 1.3 Refresh Token

**Endpoint:** `POST /v1/api/refresh-token`

**Description:** Get new access token using refresh token. Prevents token reuse attacks.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <refresh_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Get token success!",
  "status": 200,
  "metadata": {
    "user": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "email": "john@example.com",
      "password": "<hashed>",
      "fullName": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Security Features:**

- Tracks used refresh tokens in `refreshTokensUsed` array
- Detects token reuse attempts
- Automatically invalidates all user tokens on reuse detection

**Error Responses:**

`403 FORBIDDEN` - Token reuse detected

```json
{
  "status": 403,
  "message": "Something wrong happen! Pls re login"
}
```

`401 UNAUTHORIZED` - Invalid refresh token

```json
{
  "status": 401,
  "message": "Shop not registered"
}
```

---

### 1.4 Logout User

**Endpoint:** `POST /v1/api/logout`

**Description:** Invalidate all tokens by removing keyStore record.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Logout success!",
  "status": 200,
  "metadata": {
    "deletedCount": 1
  }
}
```

---

## 2. Database Models

### 2.1 User Model

**Collection:** `Users`

```typescript
{
  _id: ObjectId,
  username: string,           // Unique, indexed
  email: string,              // Unique, indexed
  password: string,           // Bcrypt hashed (10 rounds)
  fullName: string,
  avatar: string | null,      // Optional, default: null
  bio: string | null,         // Optional, default: null
  role: string,               // enum: ['user', 'poster', 'admin'], default: 'user'
  status: string,             // enum: ['active', 'inactive'], default: 'active'
  createdOn: Date,            // Auto-generated
  modifiedOn: Date            // Auto-updated
}
```

### 2.2 KeyToken Model

**Collection:** `Keys`

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to User, indexed
  publicKey: string,          // RSA public key (PEM format)
  privateKey: string,         // RSA private key (PEM format)
  refreshToken: string,       // Current valid refresh token
  refreshTokensUsed: string[], // Array of used refresh tokens
  createdOn: Date,
  modifiedOn: Date
}
```

---

## 3. Error Status Codes

| Status Code | Reason Phrase         | Usage                                 |
| ----------- | --------------------- | ------------------------------------- |
| `200`       | OK                    | Successful GET, PUT, DELETE           |
| `201`       | CREATED               | Successful POST (resource created)    |
| `400`       | BAD REQUEST           | Validation error, duplicate entry     |
| `401`       | UNAUTHORIZED          | Authentication failed, invalid token  |
| `403`       | FORBIDDEN             | Token reuse, insufficient permissions |
| `404`       | NOT FOUND             | Resource not found                    |
| `409`       | CONFLICT              | Duplicate resource                    |
| `500`       | INTERNAL SERVER ERROR | Server error                          |

---

## 4. Future Endpoints (Not Yet Implemented)

The following models exist but endpoints are not yet implemented:

### Categories

- Get all categories
- Get single category
- Create category (Admin)
- Update category (Admin)
- Delete category (Admin)

### Posts

- Get all posts (with filters, pagination)
- Get single post
- Create post (Poster/Admin)
- Update post (Author/Admin)
- Delete post (Author/Admin)
- Like/unlike post
- Share post

### Comments

- Get post comments
- Create comment/reply
- Update comment
- Delete comment
- Like/unlike comment

### Likes & Shares

- Track post likes
- Track post shares

### Notifications

- Get user notifications
- Mark as read
- Delete notification

---

## 5. Testing the API

### Using cURL

**Register:**

```bash
curl -X POST http://localhost:5000/v1/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:5000/v1/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Logout:**

```bash
curl -X POST http://localhost:5000/v1/api/logout \
  -H "x-client-id: <user_id>" \
  -H "Authorization: <access_token>"
```

### Using Postman

1. Create environment variables:
   - `base_url`: `http://localhost:5000/v1/api`
   - `user_id`: (save from login response)
   - `access_token`: (save from login response)

2. Set up headers for protected routes:
   - Key: `x-client-id`, Value: `{{user_id}}`
   - Key: `Authorization`, Value: `{{access_token}}`

---

## 6. Security Considerations

### Password Security

- Passwords hashed with bcrypt (10 salt rounds)
- Never returned in API responses

### Token Security

- RSA key pairs generated per user (not shared across users)
- Access tokens short-lived (2 days)
- Refresh tokens tracked to prevent reuse
- Automatic invalidation on suspicious activity

### Headers Validation

- Both `x-client-id` and `Authorization` required
- Token payload must match user ID in header
- Public key retrieved from database for verification

---

## 7. Development Notes

### Running the Backend

```bash
cd Backend-IE213
npm install
npm run dev  # Runs on port 5000
```

### MongoDB Connection

```
mongodb://localhost:10236/IE213
```

### Environment Variables (.env)

```env
DEV_DB_HOST=localhost
DEV_DB_PORT=10236
DEV_DB_NAME=IE213
PORT=5000
```

---

## Changelog

**Version 1.0** (Current)

- ✅ User registration with RSA key generation
- ✅ User login with JWT token pair
- ✅ Refresh token endpoint with reuse detection
- ✅ Logout endpoint
- ❌ User profile endpoints (not implemented)
- ❌ Posts, Comments, Likes, Shares (models exist, endpoints pending)
- ❌ Categories (model exists, endpoints pending)
- ❌ Notifications (model exists, endpoints pending)
