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

### 2.3 Post Model

**Collection:** `Posts`

```typescript
{
  _id: ObjectId,
  title: string,              // Required, indexed
  slug: string,               // Unique, indexed, auto-generated from title
  content: string,            // Full post content (markdown)
  excerpt: string,            // Short description
  coverImage: string | null,  // Optional cover image URL
  authorId: ObjectId,         // Reference to User, indexed
  categoryId: ObjectId,       // Reference to Category, indexed
  status: string,             // enum: ['draft', 'published', 'archived'], default: 'draft'
  viewCount: number,          // Default: 0
  publishedAt: Date | null,   // Null if draft
  createdOn: Date,
  modifiedOn: Date
}
```

### 2.4 Category Model

**Collection:** `Categories`

```typescript
{
  _id: ObjectId,
  name: string,               // Required, unique
  slug: string,               // Unique, indexed, auto-generated
  description: string,        // Optional
  icon: string | null,        // Optional icon URL
  createdOn: Date,
  modifiedOn: Date
}
```

### 2.5 Comment Model

**Collection:** `Comments`

```typescript
{
  _id: ObjectId,
  postId: ObjectId,           // Reference to Post, indexed
  authorId: ObjectId,         // Reference to User, indexed
  content: string,            // Required, comment text
  parentId: ObjectId | null,  // Reference to parent Comment (for replies), null for top-level
  isEdited: boolean,          // Default: false
  createdOn: Date,
  modifiedOn: Date
}
```

### 2.6 Like Model

**Collection:** `Likes`

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to User, indexed
  targetId: ObjectId,         // Reference to Post or Comment, indexed
  targetType: string,         // enum: ['post', 'comment']
  createdOn: Date
}
```

### 2.7 Share Model

**Collection:** `Shares`

```typescript
{
  _id: ObjectId,
  postId: ObjectId,           // Reference to Post, indexed
  userId: ObjectId,           // Reference to User, indexed
  platform: string,           // enum: ['facebook', 'twitter', 'linkedin', 'other']
  message: string | null,     // Optional message when sharing
  createdOn: Date
}
```

### 2.8 Notification Model

**Collection:** `Notifications`

```typescript
{
  _id: ObjectId,
  recipientId: ObjectId,      // Reference to User who receives notification, indexed
  senderId: ObjectId,         // Reference to User who triggered notification
  type: string,               // enum: ['like', 'comment', 'share', 'follow']
  message: string,            // Notification message
  targetId: ObjectId,         // Reference to related Post/Comment
  targetType: string,         // enum: ['post', 'comment']
  isRead: boolean,            // Default: false, indexed
  readAt: Date | null,        // Timestamp when marked as read
  createdOn: Date
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

## 4. User Management Endpoints

### 4.1 Get User Profile

**Endpoint:** `GET /v1/api/users/:userId`

**Description:** Get detailed user profile information.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Software developer passionate about web technologies",
    "role": "user",
    "status": "active",
    "createdOn": "2026-01-15T10:00:00Z"
  }
}
```

---

### 4.2 Update User Profile

**Endpoint:** `PUT /v1/api/users/:userId`

**Description:** Update user profile (own profile only).

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Request Body:**

```json
{
  "fullName": "John Updated",
  "bio": "Updated bio text",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Profile updated successfully",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "username": "johndoe",
    "fullName": "John Updated",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "Updated bio text"
  }
}
```

---

### 4.3 Get All Users (Admin Only)

**Endpoint:** `GET /v1/api/users`

**Description:** Get paginated list of all users.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)
- `role` (filter: user/poster/admin)
- `status` (filter: active/inactive)
- `search` (search by username/email/fullName)

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "users": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "username": "johndoe",
        "email": "john@example.com",
        "fullName": "John Doe",
        "role": "user",
        "status": "active",
        "createdOn": "2026-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

---

### 4.4 Delete User (Admin Only)

**Endpoint:** `DELETE /v1/api/users/:userId`

**Description:** Soft delete or permanently delete a user.

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "User deleted successfully",
  "status": 200,
  "metadata": {
    "deletedCount": 1
  }
}
```

---

### 4.5 Change User Role (Admin Only)

**Endpoint:** `PUT /v1/api/users/:userId/role`

**Description:** Change user role.

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Request Body:**

```json
{
  "role": "poster"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "User role updated successfully",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "username": "johndoe",
    "role": "poster"
  }
}
```

---

## 5. Post Management Endpoints

### 5.1 Get All Posts

**Endpoint:** `GET /v1/api/posts`

**Description:** Get paginated list of posts with filters.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)
- `status` (published/draft/archived)
- `category` (filter by category ID)
- `authorId` (filter by author)
- `search` (search in title/content)
- `sort` (newest/oldest/popular/trending)

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "posts": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "title": "Introduction to Node.js",
        "slug": "introduction-to-nodejs",
        "excerpt": "Learn the basics of Node.js...",
        "coverImage": "https://example.com/cover.jpg",
        "author": {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
          "username": "johndoe",
          "avatar": "https://example.com/avatar.jpg"
        },
        "category": {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e3",
          "name": "Technology"
        },
        "status": "published",
        "viewCount": 1250,
        "likesCount": 45,
        "commentsCount": 12,
        "sharesCount": 8,
        "publishedAt": "2026-01-20T10:00:00Z",
        "createdOn": "2026-01-20T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 250,
      "pages": 25
    }
  }
}
```

---

### 5.2 Get Single Post

**Endpoint:** `GET /v1/api/posts/:postId`

**Alternative:** `GET /v1/api/posts/slug/:slug`

**Description:** Get detailed post information.

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "title": "Introduction to Node.js",
    "slug": "introduction-to-nodejs",
    "content": "Full markdown content here...",
    "excerpt": "Learn the basics of Node.js...",
    "coverImage": "https://example.com/cover.jpg",
    "author": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
      "username": "johndoe",
      "fullName": "John Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "category": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e3",
      "name": "Technology",
      "slug": "technology"
    },
    "status": "published",
    "viewCount": 1251,
    "likesCount": 45,
    "commentsCount": 12,
    "sharesCount": 8,
    "isLiked": false,
    "publishedAt": "2026-01-20T10:00:00Z",
    "createdOn": "2026-01-20T09:00:00Z",
    "modifiedOn": "2026-01-20T09:00:00Z"
  }
}
```

---

### 5.3 Create Post (Poster/Admin Only)

**Endpoint:** `POST /v1/api/posts`

**Description:** Create a new blog post.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Request Body:**

```json
{
  "title": "Introduction to Node.js",
  "content": "Full markdown content here...",
  "excerpt": "Learn the basics of Node.js...",
  "coverImage": "https://example.com/cover.jpg",
  "categoryId": "65a1b2c3d4e5f6a7b8c9d0e3",
  "status": "published"
}
```

**Success Response:** `201 CREATED`

```json
{
  "message": "Post created successfully",
  "status": 201,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "title": "Introduction to Node.js",
    "slug": "introduction-to-nodejs",
    "authorId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "categoryId": "65a1b2c3d4e5f6a7b8c9d0e3",
    "status": "published",
    "createdOn": "2026-01-20T09:00:00Z"
  }
}
```

---

### 5.4 Update Post (Author/Admin Only)

**Endpoint:** `PUT /v1/api/posts/:postId`

**Description:** Update existing post (author can only update own posts).

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "excerpt": "Updated excerpt...",
  "coverImage": "https://example.com/new-cover.jpg",
  "categoryId": "65a1b2c3d4e5f6a7b8c9d0e4",
  "status": "published"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Post updated successfully",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "title": "Updated Title",
    "slug": "updated-title",
    "modifiedOn": "2026-01-21T10:00:00Z"
  }
}
```

---

### 5.5 Delete Post (Author/Admin Only)

**Endpoint:** `DELETE /v1/api/posts/:postId`

**Description:** Delete a post (soft delete to archived status).

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Post deleted successfully",
  "status": 200,
  "metadata": {
    "deletedCount": 1
  }
}
```

---

### 5.6 Like Post

**Endpoint:** `POST /v1/api/posts/:postId/like`

**Description:** Like a post (toggle like).

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Post liked successfully",
  "status": 200,
  "metadata": {
    "postId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "isLiked": true,
    "likesCount": 46
  }
}
```

---

### 5.7 Unlike Post

**Endpoint:** `DELETE /v1/api/posts/:postId/like`

**Description:** Remove like from a post.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Post unliked successfully",
  "status": 200,
  "metadata": {
    "postId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "isLiked": false,
    "likesCount": 45
  }
}
```

---

### 5.8 Share Post

**Endpoint:** `POST /v1/api/posts/:postId/share`

**Description:** Track post share action.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Request Body:**

```json
{
  "platform": "facebook",
  "message": "Check out this awesome post!"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Post shared successfully",
  "status": 200,
  "metadata": {
    "postId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "platform": "facebook",
    "sharesCount": 9,
    "sharedOn": "2026-01-21T11:00:00Z"
  }
}
```

---

### 5.9 Get Trending Posts

**Endpoint:** `GET /v1/api/posts/trending`

**Description:** Get trending posts based on views, likes, and comments.

**Query Parameters:**

- `period` (today/week/month, default: week)
- `limit` (default: 10)

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "posts": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "title": "Introduction to Node.js",
        "slug": "introduction-to-nodejs",
        "trendingScore": 1500,
        "viewCount": 1250,
        "likesCount": 45,
        "commentsCount": 12
      }
    ]
  }
}
```

---

## 6. Comment Management Endpoints

### 6.1 Get Post Comments

**Endpoint:** `GET /v1/api/posts/:postId/comments`

**Description:** Get all comments for a specific post.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `sort` (newest/oldest/popular, default: newest)

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "comments": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "postId": "65a1b2c3d4e5f6a7b8c9d0e2",
        "author": {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e3",
          "username": "janedoe",
          "avatar": "https://example.com/avatar2.jpg"
        },
        "content": "Great article! Very informative.",
        "parentId": null,
        "likesCount": 5,
        "repliesCount": 2,
        "isEdited": false,
        "createdOn": "2026-01-20T11:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### 6.2 Create Comment

**Endpoint:** `POST /v1/api/posts/:postId/comments`

**Description:** Add a new comment to a post.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Request Body:**

```json
{
  "content": "This is my comment",
  "parentId": null
}
```

**Success Response:** `201 CREATED`

```json
{
  "message": "Comment created successfully",
  "status": 201,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "postId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "authorId": "65a1b2c3d4e5f6a7b8c9d0e3",
    "content": "This is my comment",
    "parentId": null,
    "createdOn": "2026-01-20T12:00:00Z"
  }
}
```

---

### 6.3 Create Reply

**Endpoint:** `POST /v1/api/posts/:postId/comments`

**Description:** Reply to an existing comment.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Request Body:**

```json
{
  "content": "This is my reply to the comment",
  "parentId": "65a1b2c3d4e5f6a7b8c9d0e1"
}
```

**Success Response:** `201 CREATED`

```json
{
  "message": "Reply created successfully",
  "status": 201,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e4",
    "postId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "authorId": "65a1b2c3d4e5f6a7b8c9d0e5",
    "content": "This is my reply to the comment",
    "parentId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "createdOn": "2026-01-20T12:05:00Z"
  }
}
```

---

### 6.4 Update Comment

**Endpoint:** `PUT /v1/api/comments/:commentId`

**Description:** Update own comment.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Request Body:**

```json
{
  "content": "Updated comment text"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Comment updated successfully",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "content": "Updated comment text",
    "isEdited": true,
    "modifiedOn": "2026-01-20T12:30:00Z"
  }
}
```

---

### 6.5 Delete Comment

**Endpoint:** `DELETE /v1/api/comments/:commentId`

**Description:** Delete own comment (or admin can delete any comment).

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Comment deleted successfully",
  "status": 200,
  "metadata": {
    "deletedCount": 1
  }
}
```

---

### 6.6 Like Comment

**Endpoint:** `POST /v1/api/comments/:commentId/like`

**Description:** Like a comment.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Comment liked successfully",
  "status": 200,
  "metadata": {
    "commentId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "isLiked": true,
    "likesCount": 6
  }
}
```

---

### 6.7 Unlike Comment

**Endpoint:** `DELETE /v1/api/comments/:commentId/like`

**Description:** Remove like from a comment.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Comment unliked successfully",
  "status": 200,
  "metadata": {
    "commentId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "userId": "65a1b2c3d4e5f6a7b8c9d0e2",
    "isLiked": false,
    "likesCount": 5
  }
}
```

---

### 6.8 Get Comment Replies

**Endpoint:** `GET /v1/api/comments/:commentId/replies`

**Description:** Get all replies to a specific comment.

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "replies": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e4",
        "parentId": "65a1b2c3d4e5f6a7b8c9d0e1",
        "author": {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e5",
          "username": "bobsmith",
          "avatar": "https://example.com/avatar3.jpg"
        },
        "content": "I agree!",
        "likesCount": 2,
        "createdOn": "2026-01-20T12:05:00Z"
      }
    ]
  }
}
```

---

## 7. Category Management Endpoints

### 7.1 Get All Categories

**Endpoint:** `GET /v1/api/categories`

**Description:** Get all available categories.

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "categories": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "name": "Technology",
        "slug": "technology",
        "description": "All about technology and programming",
        "icon": "https://example.com/tech-icon.png",
        "postCount": 150,
        "createdOn": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 7.2 Get Single Category

**Endpoint:** `GET /v1/api/categories/:categoryId`

**Alternative:** `GET /v1/api/categories/slug/:slug`

**Description:** Get category details with associated posts.

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Technology",
    "slug": "technology",
    "description": "All about technology and programming",
    "icon": "https://example.com/tech-icon.png",
    "postCount": 150,
    "createdOn": "2026-01-01T00:00:00Z"
  }
}
```

---

### 7.3 Create Category (Admin Only)

**Endpoint:** `POST /v1/api/categories`

**Description:** Create a new category.

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Request Body:**

```json
{
  "name": "Technology",
  "description": "All about technology and programming",
  "icon": "https://example.com/tech-icon.png"
}
```

**Success Response:** `201 CREATED`

```json
{
  "message": "Category created successfully",
  "status": 201,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Technology",
    "slug": "technology",
    "description": "All about technology and programming",
    "icon": "https://example.com/tech-icon.png",
    "createdOn": "2026-01-20T10:00:00Z"
  }
}
```

---

### 7.4 Update Category (Admin Only)

**Endpoint:** `PUT /v1/api/categories/:categoryId`

**Description:** Update category information.

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Request Body:**

```json
{
  "name": "Technology & Programming",
  "description": "Updated description",
  "icon": "https://example.com/new-icon.png"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Category updated successfully",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Technology & Programming",
    "slug": "technology-programming",
    "description": "Updated description",
    "modifiedOn": "2026-01-20T11:00:00Z"
  }
}
```

---

### 7.5 Delete Category (Admin Only)

**Endpoint:** `DELETE /v1/api/categories/:categoryId`

**Description:** Delete a category (only if no posts are associated).

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Category deleted successfully",
  "status": 200,
  "metadata": {
    "deletedCount": 1
  }
}
```

**Error Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Cannot delete category with existing posts"
}
```

---

## 8. Notification Management Endpoints

### 8.1 Get User Notifications

**Endpoint:** `GET /v1/api/notifications`

**Description:** Get all notifications for the authenticated user.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `isRead` (true/false/all, default: all)
- `type` (like/comment/share/follow, optional)

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "notifications": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "recipientId": "65a1b2c3d4e5f6a7b8c9d0e2",
        "senderId": "65a1b2c3d4e5f6a7b8c9d0e3",
        "type": "like",
        "message": "John Doe liked your post",
        "targetType": "post",
        "targetId": "65a1b2c3d4e5f6a7b8c9d0e4",
        "isRead": false,
        "sender": {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e3",
          "username": "johndoe",
          "avatar": "https://example.com/avatar.jpg"
        },
        "createdOn": "2026-01-20T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    },
    "unreadCount": 12
  }
}
```

---

### 8.2 Get Unread Count

**Endpoint:** `GET /v1/api/notifications/unread-count`

**Description:** Get count of unread notifications.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "unreadCount": 12
  }
}
```

---

### 8.3 Mark Notification as Read

**Endpoint:** `PUT /v1/api/notifications/:notificationId/read`

**Description:** Mark a specific notification as read.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Notification marked as read",
  "status": 200,
  "metadata": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "isRead": true,
    "readAt": "2026-01-20T12:30:00Z"
  }
}
```

---

### 8.4 Mark All as Read

**Endpoint:** `PUT /v1/api/notifications/read-all`

**Description:** Mark all notifications as read for the authenticated user.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "All notifications marked as read",
  "status": 200,
  "metadata": {
    "modifiedCount": 12
  }
}
```

---

### 8.5 Delete Notification

**Endpoint:** `DELETE /v1/api/notifications/:notificationId`

**Description:** Delete a specific notification.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Notification deleted successfully",
  "status": 200,
  "metadata": {
    "deletedCount": 1
  }
}
```

---

### 8.6 Delete All Read Notifications

**Endpoint:** `DELETE /v1/api/notifications/read`

**Description:** Delete all read notifications for the authenticated user.

**Headers:**

```http
x-client-id: <user_id>
Authorization: <access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Read notifications deleted successfully",
  "status": 200,
  "metadata": {
    "deletedCount": 25
  }
}
```

---

## 9. Statistics & Analytics Endpoints (Admin Only)

### 9.1 Get Dashboard Statistics

**Endpoint:** `GET /v1/api/admin/stats/dashboard`

**Description:** Get overall system statistics for admin dashboard.

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "totalUsers": 1500,
    "totalPosts": 650,
    "totalComments": 3200,
    "totalLikes": 12500,
    "totalShares": 850,
    "totalCategories": 12,
    "activeUsers": 450,
    "newUsersThisWeek": 45,
    "newUsersThisMonth": 180,
    "newPostsThisWeek": 30,
    "newPostsThisMonth": 120,
    "topCategories": [
      {
        "categoryId": "65a1b2c3d4e5f6a7b8c9d0e1",
        "name": "Technology",
        "postCount": 150
      }
    ]
  }
}
```

---

### 9.2 Get User Statistics

**Endpoint:** `GET /v1/api/admin/stats/users`

**Description:** Get detailed user statistics.

**Query Parameters:**

- `period` (week/month/year, default: month)

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "totalUsers": 1500,
    "activeUsers": 450,
    "inactiveUsers": 50,
    "usersByRole": {
      "user": 1350,
      "poster": 140,
      "admin": 10
    },
    "registrationTrend": [
      {
        "date": "2026-01-13",
        "count": 12
      },
      {
        "date": "2026-01-14",
        "count": 15
      }
    ],
    "topContributors": [
      {
        "userId": "65a1b2c3d4e5f6a7b8c9d0e1",
        "username": "johndoe",
        "postCount": 45,
        "commentCount": 230
      }
    ]
  }
}
```

---

### 9.3 Get Post Statistics

**Endpoint:** `GET /v1/api/admin/stats/posts`

**Description:** Get detailed post statistics.

**Query Parameters:**

- `period` (week/month/year, default: month)

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "totalPosts": 650,
    "publishedPosts": 600,
    "draftPosts": 40,
    "archivedPosts": 10,
    "totalViews": 125000,
    "totalLikes": 12500,
    "totalComments": 3200,
    "totalShares": 850,
    "averageViewsPerPost": 192,
    "averageLikesPerPost": 19,
    "averageCommentsPerPost": 5,
    "postsByCategory": [
      {
        "categoryId": "65a1b2c3d4e5f6a7b8c9d0e1",
        "name": "Technology",
        "postCount": 150,
        "viewCount": 35000
      }
    ],
    "topPosts": [
      {
        "postId": "65a1b2c3d4e5f6a7b8c9d0e2",
        "title": "Introduction to Node.js",
        "viewCount": 5200,
        "likesCount": 450,
        "commentsCount": 120
      }
    ]
  }
}
```

---

### 9.4 Get Activity Statistics

**Endpoint:** `GET /v1/api/admin/stats/activity`

**Description:** Get system activity statistics (likes, comments, shares).

**Query Parameters:**

- `period` (week/month/year, default: month)

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "totalLikes": 12500,
    "totalComments": 3200,
    "totalShares": 850,
    "activityTrend": [
      {
        "date": "2026-01-13",
        "likes": 450,
        "comments": 120,
        "shares": 35
      }
    ],
    "mostActiveHours": [
      {
        "hour": 14,
        "activityCount": 850
      }
    ]
  }
}
```

---

### 9.5 Get Category Statistics

**Endpoint:** `GET /v1/api/admin/stats/categories`

**Description:** Get statistics for all categories.

**Headers:**

```http
x-client-id: <admin_user_id>
Authorization: <admin_access_token>
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "status": 200,
  "metadata": {
    "totalCategories": 12,
    "categories": [
      {
        "categoryId": "65a1b2c3d4e5f6a7b8c9d0e1",
        "name": "Technology",
        "postCount": 150,
        "viewCount": 35000,
        "likesCount": 3200,
        "commentsCount": 850,
        "averageEngagement": 27
      }
    ]
  }
}
```

---

## 10. Testing the API

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

**Version 2.0** (Updated - February 4, 2026)

### ✅ Implemented Features

**Authentication:**

- User registration with RSA key pair generation
- User login with JWT token pair (access + refresh)
- Refresh token endpoint with reuse detection
- Logout endpoint with keyStore cleanup

**User Management:**

- Get user profile
- Update user profile
- Get all users (Admin only)
- Delete user (Admin only)
- Change user role (Admin only)

**Post Management:**

- Get all posts with filters and pagination
- Get single post by ID or slug
- Create post (Poster/Admin only)
- Update post (Author/Admin only)
- Delete post (Author/Admin only)
- Like/unlike post
- Share post with tracking
- Get trending posts

**Comment Management:**

- Get post comments with pagination
- Create comment
- Create reply to comment
- Update comment
- Delete comment
- Like/unlike comment
- Get comment replies

**Category Management:**

- Get all categories
- Get single category by ID or slug
- Create category (Admin only)
- Update category (Admin only)
- Delete category (Admin only)

**Notification System:**

- Get user notifications with filters
- Get unread notification count
- Mark single notification as read
- Mark all notifications as read
- Delete notification
- Delete all read notifications

**Statistics & Analytics (Admin Only):**

- Dashboard statistics overview
- User statistics and trends
- Post statistics and top posts
- Activity statistics (likes, comments, shares)
- Category statistics and engagement

### 📋 Database Models

All models implemented with complete schemas:

- User Model (authentication, profiles, roles)
- KeyToken Model (RSA keys, refresh tokens)
- Post Model (content, status, engagement tracking)
- Category Model (organization, metadata)
- Comment Model (nested replies support)
- Like Model (polymorphic: posts and comments)
- Share Model (social media tracking)
- Notification Model (real-time updates)

### 🔐 Security Features

- RSA-based JWT (RS256 algorithm)
- Bcrypt password hashing (10 rounds)
- Token reuse detection and prevention
- Role-based access control (user/poster/admin)
- Request header validation (x-client-id + Authorization)

### 📊 API Features

- Pagination support on all list endpoints
- Advanced filtering and search
- Sorting options (newest/oldest/popular/trending)
- Comprehensive error handling
- Consistent response format across all endpoints

---

**Version 1.0** (Initial Release)

- Basic authentication endpoints only
- User and KeyToken models
- Foundation for future features
