# API Documentation - Blog System

## Tech Stack: MENN (MongoDB, Express, Next.js, Node.js)

Base URL: `http://localhost:5000/api/v1`

---

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## 1. Authentication & Authorization

### 1.1 Register User

**POST** `/auth/register`

**Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "user"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6...",
      "username": "johndoe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "user",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Login User

**POST** `/auth/login`

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Get Current User

**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6...",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

### 1.4 Logout User

**POST** `/auth/logout`

**Response:** `200 OK`

---

## 2. Users

### 2.1 Get All Users (Admin Only)

**GET** `/users`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)
- `role` (filter by role)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50
    }
  }
}
```

### 2.2 Get User Profile

**GET** `/users/:userId`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6...",
    "username": "johndoe",
    "fullName": "John Doe",
    "avatar": "https://...",
    "bio": "Software developer",
    "followers": 120,
    "following": 50,
    "postsCount": 15
  }
}
```

### 2.3 Update User Profile

**PUT** `/users/:userId`

**Body:**

```json
{
  "fullName": "John Updated",
  "bio": "New bio",
  "avatar": "https://..."
}
```

**Response:** `200 OK`

### 2.4 Delete User (Admin Only)

**DELETE** `/users/:userId`

**Response:** `200 OK`

### 2.5 Follow User

**POST** `/users/:userId/follow`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "User followed successfully"
}
```

### 2.6 Unfollow User

**DELETE** `/users/:userId/follow`

**Response:** `200 OK`

### 2.7 Get User Followers

**GET** `/users/:userId/followers`

**Response:** `200 OK`

### 2.8 Get User Following

**GET** `/users/:userId/following`

**Response:** `200 OK`

---

## 3. Posts

### 3.1 Get All Posts

**GET** `/posts`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 10)
- `status` (published/draft/archived)
- `category` (filter by category)
- `tags` (comma-separated tags)
- `authorId` (filter by author)
- `search` (text search)
- `sort` (newest/oldest/popular/trending)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "65a1b2c3d4e5f6...",
        "title": "My First Blog Post",
        "excerpt": "This is a short excerpt...",
        "coverImage": "https://...",
        "slug": "my-first-blog-post",
        "author": {
          "_id": "...",
          "username": "johndoe",
          "avatar": "..."
        },
        "category": "Technology",
        "tags": ["javascript", "nodejs"],
        "likesCount": 45,
        "commentsCount": 12,
        "viewCount": 234,
        "publishedAt": "2026-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### 3.2 Get Single Post

**GET** `/posts/:postId` or `/posts/slug/:slug`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6...",
    "title": "My First Blog Post",
    "content": "Full content here...",
    "excerpt": "Short excerpt...",
    "coverImage": "https://...",
    "slug": "my-first-blog-post",
    "author": {
      "_id": "...",
      "username": "johndoe",
      "fullName": "John Doe",
      "avatar": "..."
    },
    "category": "Technology",
    "tags": ["javascript", "nodejs"],
    "status": "published",
    "likesCount": 45,
    "commentsCount": 12,
    "sharesCount": 5,
    "viewCount": 235,
    "isLiked": false,
    "publishedAt": "2026-01-20T10:00:00Z",
    "createdAt": "2026-01-20T09:00:00Z"
  }
}
```

### 3.3 Create Post (Poster/Admin)

**POST** `/posts`

**Body:**

```json
{
  "title": "My New Post",
  "content": "Full content here...",
  "excerpt": "Short excerpt...",
  "coverImage": "https://...",
  "category": "Technology",
  "tags": ["javascript", "nodejs"],
  "status": "published"
}
```

**Response:** `201 Created`

### 3.4 Update Post (Author/Admin)

**PUT** `/posts/:postId`

**Body:** (same as create, all fields optional)

**Response:** `200 OK`

### 3.5 Delete Post (Author/Admin)

**DELETE** `/posts/:postId`

**Response:** `200 OK`

### 3.6 Like Post

**POST** `/posts/:postId/like`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Post liked successfully",
  "data": {
    "likesCount": 46
  }
}
```

### 3.7 Unlike Post

**DELETE** `/posts/:postId/like`

**Response:** `200 OK`

### 3.8 Share Post

**POST** `/posts/:postId/share`

**Body:**

```json
{
  "platform": "facebook",
  "message": "Check this out!"
}
```

**Response:** `200 OK`

### 3.9 Get Trending Posts

**GET** `/posts/trending`

**Query Parameters:**

- `period` (today/week/month)

**Response:** `200 OK`

### 3.10 Get User Feed

**GET** `/posts/feed`

Returns posts from followed users.

**Response:** `200 OK`

---

## 4. Comments

### 4.1 Get Post Comments

**GET** `/posts/:postId/comments`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `sort` (newest/oldest/popular)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "65a1b2c3d4e5f6...",
        "postId": "...",
        "author": {
          "_id": "...",
          "username": "janedoe",
          "avatar": "..."
        },
        "content": "Great post!",
        "likesCount": 5,
        "isEdited": false,
        "replies": [
          {
            "_id": "...",
            "content": "Thank you!",
            "author": {...},
            "createdAt": "..."
          }
        ],
        "createdAt": "2026-01-20T11:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### 4.2 Create Comment

**POST** `/posts/:postId/comments`

**Body:**

```json
{
  "content": "This is my comment",
  "parentId": null
}
```

**Response:** `201 Created`

### 4.3 Update Comment

**PUT** `/comments/:commentId`

**Body:**

```json
{
  "content": "Updated comment"
}
```

**Response:** `200 OK`

### 4.4 Delete Comment

**DELETE** `/comments/:commentId`

**Response:** `200 OK`

### 4.5 Like Comment

**POST** `/comments/:commentId/like`

**Response:** `200 OK`

### 4.6 Unlike Comment

**DELETE** `/comments/:commentId/like`

**Response:** `200 OK`

---

## 5. Categories

### 5.1 Get All Categories

**GET** `/categories`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Technology",
      "slug": "technology",
      "description": "Tech related posts",
      "icon": "https://...",
      "postCount": 150
    }
  ]
}
```

### 5.2 Get Single Category

**GET** `/categories/:categoryId` or `/categories/slug/:slug`

**Response:** `200 OK`

### 5.3 Create Category (Admin Only)

**POST** `/categories`

**Body:**

```json
{
  "name": "Technology",
  "description": "Tech related posts",
  "icon": "https://..."
}
```

**Response:** `201 Created`

### 5.4 Update Category (Admin Only)

**PUT** `/categories/:categoryId`

**Response:** `200 OK`

### 5.5 Delete Category (Admin Only)

**DELETE** `/categories/:categoryId`

**Response:** `200 OK`

---

## 6. Notifications

### 6.1 Get User Notifications

**GET** `/notifications`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `isRead` (true/false/all)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "...",
        "type": "like",
        "actor": {
          "_id": "...",
          "username": "janedoe",
          "avatar": "..."
        },
        "message": "janedoe liked your post",
        "targetId": "...",
        "targetType": "post",
        "isRead": false,
        "createdAt": "2026-01-20T12:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### 6.2 Mark Notification as Read

**PUT** `/notifications/:notificationId/read`

**Response:** `200 OK`

### 6.3 Mark All as Read

**PUT** `/notifications/read-all`

**Response:** `200 OK`

### 6.4 Delete Notification

**DELETE** `/notifications/:notificationId`

**Response:** `200 OK`

### 6.5 Get Unread Count

**GET** `/notifications/unread-count`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## 7. Statistics (Admin Only)

### 7.1 Get Dashboard Stats

**GET** `/admin/stats/dashboard`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "totalPosts": 500,
    "totalComments": 3000,
    "totalLikes": 10000,
    "newUsersThisWeek": 50,
    "newPostsThisWeek": 30
  }
}
```

### 7.2 Get User Stats

**GET** `/admin/stats/users`

**Response:** `200 OK`

### 7.3 Get Post Stats

**GET** `/admin/stats/posts`

**Response:** `200 OK`

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error message here",
    "code": "ERROR_CODE"
  }
}
```

**HTTP Status Codes:**

- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict (duplicate)
- `422` Validation Error
- `500` Internal Server Error

---

## Rate Limiting

- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- Admin: Unlimited

---

## WebSocket Events (Real-time Updates)

### Connection

```javascript
const socket = io("http://localhost:5000", {
  auth: { token: "<jwt_token>" },
});
```

### Events to Listen:

- `notification:new` - New notification received
- `post:liked` - Post was liked
- `comment:new` - New comment on user's post
- `user:followed` - New follower

### Events to Emit:

- `post:view` - Track post view
- `typing` - User is typing a comment

---

## Pagination Format

All paginated endpoints return:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Search Functionality

### Full Text Search

**GET** `/posts?search=keyword`

### Advanced Search

**POST** `/posts/search`

**Body:**

```json
{
  "query": "javascript",
  "filters": {
    "category": "Technology",
    "tags": ["nodejs", "express"],
    "dateFrom": "2026-01-01",
    "dateTo": "2026-01-31"
  },
  "sort": "relevance"
}
```

---

## File Upload

### Upload Image

**POST** `/upload/image`

**Body:** `multipart/form-data`

- `image`: File

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/images/abc123.jpg",
    "filename": "abc123.jpg"
  }
}
```

**Limitations:**

- Max file size: 5MB
- Allowed formats: JPG, PNG, GIF, WebP
