# ERD - Blog System

## Tech Stack: MENN (MongoDB, Express, Next.js, Node.js)

---

## Entities and Relationships

### 1. **User** (Users Collection)

Lưu trữ thông tin người dùng trong hệ thống.

| Field     | Type            | Description                          |
| --------- | --------------- | ------------------------------------ |
| \_id      | ObjectId        | Primary Key                          |
| username  | String          | Tên đăng nhập (unique)               |
| email     | String          | Email (unique)                       |
| password  | String          | Mật khẩu đã hash                     |
| fullName  | String          | Họ và tên                            |
| avatar    | String          | URL ảnh đại diện                     |
| bio       | String          | Tiểu sử ngắn                         |
| role      | String          | Enum: ['admin', 'user', 'poster']    |
| isActive  | Boolean         | Trạng thái hoạt động                 |
| createdAt | Date            | Ngày tạo tài khoản                   |
| updatedAt | Date            | Ngày cập nhật                        |
| followers | Array[ObjectId] | Danh sách người theo dõi (ref: User) |
| following | Array[ObjectId] | Danh sách đang theo dõi (ref: User)  |

**Relationships:**

- One-to-Many với Post (một user có thể tạo nhiều post)
- One-to-Many với Comment (một user có thể comment nhiều lần)
- Many-to-Many với User (followers/following)

---

### 2. **Post** (Posts Collection)

Lưu trữ thông tin bài viết.

| Field         | Type          | Description                              |
| ------------- | ------------- | ---------------------------------------- |
| \_id          | ObjectId      | Primary Key                              |
| authorId      | ObjectId      | Foreign Key -> User.\_id                 |
| title         | String        | Tiêu đề bài viết                         |
| content       | String        | Nội dung bài viết (HTML/Markdown)        |
| excerpt       | String        | Tóm tắt ngắn                             |
| coverImage    | String        | URL ảnh bìa                              |
| slug          | String        | URL-friendly string (unique)             |
| status        | String        | Enum: ['draft', 'published', 'archived'] |
| tags          | Array[String] | Các tag của bài viết                     |
| category      | String        | Danh mục bài viết                        |
| viewCount     | Number        | Số lượt xem                              |
| likesCount    | Number        | Số lượt thích (denormalized)             |
| commentsCount | Number        | Số lượt comment (denormalized)           |
| sharesCount   | Number        | Số lượt share (denormalized)             |
| createdAt     | Date          | Ngày tạo                                 |
| updatedAt     | Date          | Ngày cập nhật                            |
| publishedAt   | Date          | Ngày xuất bản                            |

**Relationships:**

- Many-to-One với User (nhiều post thuộc về một user)
- One-to-Many với Comment (một post có nhiều comment)
- One-to-Many với Like (một post có nhiều like)
- One-to-Many với Share (một post có nhiều share)

---

### 3. **Comment** (Comments Collection)

Lưu trữ bình luận trên bài viết.

| Field      | Type     | Description                               |
| ---------- | -------- | ----------------------------------------- |
| \_id       | ObjectId | Primary Key                               |
| postId     | ObjectId | Foreign Key -> Post.\_id                  |
| authorId   | ObjectId | Foreign Key -> User.\_id                  |
| content    | String   | Nội dung comment                          |
| parentId   | ObjectId | Foreign Key -> Comment.\_id (for replies) |
| likesCount | Number   | Số lượt thích comment                     |
| isEdited   | Boolean  | Đã chỉnh sửa hay chưa                     |
| createdAt  | Date     | Ngày tạo                                  |
| updatedAt  | Date     | Ngày cập nhật                             |

**Relationships:**

- Many-to-One với Post (nhiều comment thuộc về một post)
- Many-to-One với User (nhiều comment thuộc về một user)
- Self-referencing (comment có thể reply comment khác)

---

### 4. **Like** (Likes Collection)

Lưu trữ thông tin like trên post và comment.

| Field      | Type     | Description               |
| ---------- | -------- | ------------------------- |
| \_id       | ObjectId | Primary Key               |
| userId     | ObjectId | Foreign Key -> User.\_id  |
| targetId   | ObjectId | ID của Post hoặc Comment  |
| targetType | String   | Enum: ['post', 'comment'] |
| createdAt  | Date     | Ngày tạo                  |

**Relationships:**

- Many-to-One với User (một user có thể like nhiều lần)
- Many-to-One với Post hoặc Comment (polymorphic relationship)

---

### 5. **Share** (Shares Collection)

Lưu trữ thông tin share bài viết.

| Field     | Type     | Description                                           |
| --------- | -------- | ----------------------------------------------------- |
| \_id      | ObjectId | Primary Key                                           |
| postId    | ObjectId | Foreign Key -> Post.\_id                              |
| userId    | ObjectId | Foreign Key -> User.\_id                              |
| platform  | String   | Enum: ['facebook', 'twitter', 'linkedin', 'internal'] |
| message   | String   | Lời nhắn khi share (optional)                         |
| createdAt | Date     | Ngày share                                            |

**Relationships:**

- Many-to-One với Post (nhiều share thuộc về một post)
- Many-to-One với User (một user có thể share nhiều lần)

---

### 6. **Category** (Categories Collection)

Lưu trữ danh mục bài viết.

| Field       | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| \_id        | ObjectId | Primary Key                  |
| name        | String   | Tên danh mục (unique)        |
| slug        | String   | URL-friendly string (unique) |
| description | String   | Mô tả danh mục               |
| icon        | String   | URL icon                     |
| postCount   | Number   | Số bài viết (denormalized)   |
| createdAt   | Date     | Ngày tạo                     |
| updatedAt   | Date     | Ngày cập nhật                |

**Relationships:**

- One-to-Many với Post (một category có nhiều post)

---

### 7. **Notification** (Notifications Collection)

Lưu trữ thông báo cho người dùng.

| Field      | Type     | Description                                             |
| ---------- | -------- | ------------------------------------------------------- |
| \_id       | ObjectId | Primary Key                                             |
| userId     | ObjectId | Foreign Key -> User.\_id (người nhận)                   |
| actorId    | ObjectId | Foreign Key -> User.\_id (người thực hiện)              |
| type       | String   | Enum: ['like', 'comment', 'share', 'follow', 'mention'] |
| targetId   | ObjectId | ID của Post/Comment/User                                |
| targetType | String   | Enum: ['post', 'comment', 'user']                       |
| message    | String   | Nội dung thông báo                                      |
| isRead     | Boolean  | Đã đọc hay chưa                                         |
| createdAt  | Date     | Ngày tạo                                                |

**Relationships:**

- Many-to-One với User (nhiều notification thuộc về một user)

---

## ERD Diagram (Text Representation)

```
┌─────────────────┐
│     USER        │
│─────────────────│
│ _id (PK)        │
│ username        │
│ email           │
│ password        │
│ fullName        │
│ avatar          │
│ bio             │
│ role            │
│ followers[]     │
│ following[]     │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │
        │ 1:N (author)
        ▼
┌─────────────────┐         ┌──────────────┐
│      POST       │◄────────┤  CATEGORY    │
│─────────────────│  N:1    │──────────────│
│ _id (PK)        │         │ _id (PK)     │
│ authorId (FK)   │         │ name         │
│ title           │         │ slug         │
│ content         │         │ description  │
│ coverImage      │         └──────────────┘
│ slug            │
│ status          │
│ tags[]          │
│ category        │
│ viewCount       │
│ likesCount      │
│ commentsCount   │
│ sharesCount     │
│ createdAt       │
└─────────────────┘
        │
        ├────────────────┐
        │ 1:N            │ 1:N
        ▼                ▼
┌─────────────────┐ ┌─────────────────┐
│    COMMENT      │ │      LIKE       │
│─────────────────│ │─────────────────│
│ _id (PK)        │ │ _id (PK)        │
│ postId (FK)     │ │ userId (FK)     │
│ authorId (FK)   │ │ targetId (FK)   │
│ content         │ │ targetType      │
│ parentId (FK)   │ │ createdAt       │
│ likesCount      │ └─────────────────┘
│ createdAt       │          ▲
│ updatedAt       │          │ N:1
└─────────────────┘          │
        │                    │
        │ self-reference     │
        └────────────────────┘

        POST
        │
        │ 1:N
        ▼
┌─────────────────┐
│     SHARE       │
│─────────────────│
│ _id (PK)        │
│ postId (FK)     │
│ userId (FK)     │
│ platform        │
│ message         │
│ createdAt       │
└─────────────────┘

        USER
        │
        │ 1:N
        ▼
┌─────────────────┐
│  NOTIFICATION   │
│─────────────────│
│ _id (PK)        │
│ userId (FK)     │
│ actorId (FK)    │
│ type            │
│ targetId (FK)   │
│ targetType      │
│ message         │
│ isRead          │
│ createdAt       │
└─────────────────┘
```

---

## Indexes (MongoDB)

### Users Collection

```javascript
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
```

### Posts Collection

```javascript
db.posts.createIndex({ authorId: 1 });
db.posts.createIndex({ slug: 1 }, { unique: true });
db.posts.createIndex({ status: 1, publishedAt: -1 });
db.posts.createIndex({ tags: 1 });
db.posts.createIndex({ category: 1 });
db.posts.createIndex({ createdAt: -1 });
```

### Comments Collection

```javascript
db.comments.createIndex({ postId: 1, createdAt: -1 });
db.comments.createIndex({ authorId: 1 });
db.comments.createIndex({ parentId: 1 });
```

### Likes Collection

```javascript
db.likes.createIndex(
  { userId: 1, targetId: 1, targetType: 1 },
  { unique: true },
);
db.likes.createIndex({ targetId: 1, targetType: 1 });
```

### Shares Collection

```javascript
db.shares.createIndex({ postId: 1 });
db.shares.createIndex({ userId: 1 });
db.shares.createIndex({ createdAt: -1 });
```

### Notifications Collection

```javascript
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ isRead: 1 });
```

---

## Business Rules

1. **User Roles:**
   - `admin`: Quản lý toàn bộ hệ thống, có thể xóa/chỉnh sửa bất kỳ nội dung nào
   - `poster`: Có thể tạo, chỉnh sửa, xóa bài viết của mình
   - `user`: Có thể đọc, comment, like, share bài viết

2. **Post Status:**
   - `draft`: Bài viết nháp, chỉ tác giả và admin có thể xem
   - `published`: Bài viết đã xuất bản, tất cả có thể xem
   - `archived`: Bài viết đã lưu trữ

3. **Comment System:**
   - Hỗ trợ nested comments (reply)
   - User có thể chỉnh sửa/xóa comment của mình
   - Admin có thể xóa bất kỳ comment nào

4. **Like System:**
   - Mỗi user chỉ có thể like một lần cho mỗi post/comment
   - Có thể unlike

5. **Share System:**
   - Track số lượt share
   - Có thể share internal hoặc external platforms

6. **Notification System:**
   - Tự động tạo notification khi:
     - User like/comment/share bài viết
     - User follow/unfollow
     - User được mention trong comment

---

## Notes for MongoDB Implementation

- Sử dụng **compound indexes** cho các query phức tạp
- **Denormalization**: likesCount, commentsCount, sharesCount được lưu trong Post để tăng performance
- **Reference vs Embed**:
  - Reference: User, Post, Comment (có thể query độc lập)
  - Có thể embed comments vào post nếu số lượng comment ít
- Sử dụng **aggregation pipeline** cho các query phức tạp (feed, statistics)
- Implement **pagination** cho posts và comments
- Sử dụng **text search** index cho tính năng tìm kiếm bài viết
