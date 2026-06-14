# UniSync HCM — Backend

> RESTful API cho nền tảng blog chia sẻ thông tin về các trường đại học tại TP. Hồ Chí Minh.
> Live API: **[api.unisynchcm.com](https://api.unisynchcm.com)**

---

## Giới thiệu

UniSync HCM Backend là hệ thống API được xây dựng theo kiến trúc phân lớp **Controller – Service – Model** bằng Node.js và Express.js. Hệ thống xử lý toàn bộ nghiệp vụ gồm xác thực, quản lý nội dung, bình luận phân cấp, thông báo bất đồng bộ và tối ưu hiệu năng với Redis.

---

## Tech Stack

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| Node.js | 20 LTS | Môi trường chạy server |
| Express.js | 4.x | Web framework API |
| TypeScript | 5.x | Ngôn ngữ lập trình |
| MongoDB + Mongoose | 7.x / 8.x | Cơ sở dữ liệu NoSQL |
| Redis | 7.x | Cache & đồng bộ lượt xem |
| RabbitMQ | 3.x | Message broker thông báo bất đồng bộ |
| DigitalOcean Spaces | — | Lưu trữ ảnh (S3-compatible) |
| Docker Compose | — | Container hóa môi trường local |

---

## Kiến trúc hệ thống

```
Request → Route → Middleware (Auth / Role / Validation) → Controller → Service → Model → MongoDB
                                                                              ↓
                                                                   Redis (Cache / ViewSync)
                                                                              ↓
                                                                   RabbitMQ (Notification Queue)
```

### Các lớp chính

- **Route** — Tiếp nhận HTTP request, áp dụng middleware xác thực và kiểm tra quyền
- **Controller** — Nhận dữ liệu đã validate, gọi Service, trả response chuẩn hóa
- **Service** — Toàn bộ logic nghiệp vụ (không phụ thuộc HTTP)
- **Model** — Mongoose schema, index, tương tác MongoDB

---

## Tính năng & API Modules

| Module | Tiền tố | Mô tả |
|---|---|---|
| Xác thực | `/v1/api/access` | Đăng ký, đăng nhập, refresh token, quên mật khẩu |
| Bài viết | `/v1/api/posts` | CRUD bài viết, trending, xuất bản |
| Bình luận | `/v1/api/comments` | Bình luận phân cấp (Nested Set), like comment |
| Thông báo | `/v1/api/notifications` | Danh sách, đánh dấu đã đọc |
| Người dùng | `/v1/api/users` | Hồ sơ, follow/unfollow, cập nhật thông tin |
| Danh mục | `/v1/api/categories` | CRUD danh mục (admin) |
| Tag | `/v1/api/tags` | CRUD tag, bật/tắt trạng thái (admin) |
| Upload | `/v1/api/upload` | Upload & optimize ảnh lên DigitalOcean Spaces |
| Quản trị | `/v1/api/admin` | Dashboard thống kê, quản lý người dùng |
| SEO Render | `/v1/api/render` | SSR cho crawler bot |

---

## Các cơ chế kỹ thuật nổi bật

### 🔐 JWT với cặp khoá RSA riêng theo tài khoản
Mỗi tài khoản có cặp khoá `private/public` riêng. Private key ký access token, public key lưu trong collection `KeyTokens`. Khi một tài khoản bị xâm phạm, chỉ cần vô hiệu hoá khoá của tài khoản đó mà không ảnh hưởng các tài khoản khác.

### 🌲 Bình luận phân cấp — Nested Set Model
Mỗi bình luận lưu `commentLeft` và `commentRight`. Toàn bộ cây con của bất kỳ bình luận nào có thể lấy bằng **một truy vấn phạm vi duy nhất**, thay vì đệ quy nhiều lần:

```js
// Lấy toàn bộ replies của comment B (L=2, R=7)
db.comments.find({ commentLeft: { $gt: 2 }, commentRight: { $lt: 7 } })
```

### ⚡ Redis Cache & View Sync
- **Cache:** Kết quả API công khai có traffic cao (trending, latest) với TTL ngắn
- **View Sync:** Tích lũy lượt xem trong Redis, định kỳ batch-write về MongoDB (tránh write-heavy trực tiếp)

### 📨 RabbitMQ — Thông báo bất đồng bộ
Khi có hành động like/comment/share/follow, `NotificationProducer` đẩy sự kiện vào queue. `NotificationConsumer` chạy độc lập, lắng nghe và ghi thông báo vào MongoDB mà không block response API chính.

### 🖼️ Image Optimization
Ảnh upload qua Multer (giới hạn 10MB), được nén và resize bởi `image-optimizer.service`, sau đó lưu lên DigitalOcean Spaces. Frontend chỉ lưu URL.

---

## Cơ sở dữ liệu

Hệ thống sử dụng MongoDB với **13 collections**:

`Users` · `Posts` · `Comments` · `Categories` · `Tags` · `Notifications` · `LikePosts` · `LikeComments` · `Shares` · `KeyTokens` · `ApiKeys` · `SeoSettings` · `UrlRedirects`

### Index chiến lược

```js
// Posts — phục vụ trang chủ, danh mục, hồ sơ tác giả, trending
{ status: 1, publishedAt: -1 }
{ category: 1, status: 1 }
{ authorId: 1, status: 1 }
{ trendingScore: -1 }

// Comments
{ postId: 1 }, { userId: 1 }, { parentCommentId: 1 }

// Notifications
{ receiverId: 1 }, { type: 1, isRead: 1 }

// LikePosts / LikeComments — chống like trùng
{ userId: 1, postId: 1 } // unique
{ userId: 1, commentId: 1 } // unique
```

---

## Cài đặt & Chạy local

### Yêu cầu
- Node.js >= 18
- Docker & Docker Compose

### Các bước

```bash
# 1. Clone repo
git clone https://github.com/noahihi203/IE213-Backend.git
cd IE213-Backend

# 2. Cài dependencies
npm install

# 3. Tạo file môi trường
cp .env.example .env
```

Điền đầy đủ các biến vào `.env`:

```env
# App
PORT=3000
FRONTEND_URL=http://localhost:3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ie213

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# DigitalOcean Spaces
DO_SPACES_KEY=your_key
DO_SPACES_SECRET=your_secret
DO_SPACES_ENDPOINT=sgp1.digitaloceanspaces.com
DO_SPACES_BUCKET=your_bucket_name

# Azure Email
AZURE_EMAIL_CONNECTION_STRING=your_connection_string
AZURE_SENDER_EMAIL=DoNotReply@yourdomain.com
```

```bash
# 4. Khởi động MongoDB, Redis, RabbitMQ bằng Docker Compose
docker compose up -d

# 5. Chạy development server
npm run dev
```

API server chạy tại: [http://localhost:3000](http://localhost:3000)

### Build production

```bash
npm run build
npm run start
```

---

## Cấu trúc thư mục

```
IE213-Backend/
├── src/
│   ├── routes/             # Định tuyến & middleware áp dụng
│   ├── controllers/        # Nhận request, gọi service, trả response
│   ├── services/           # Toàn bộ logic nghiệp vụ
│   ├── models/             # Mongoose schema & index
│   ├── middlewares/        # Auth JWT, role check, validation, upload
│   ├── configs/            # Kết nối DB, Redis, RabbitMQ, logger
│   ├── workers/            # View sync worker, notification consumer
│   └── utils/              # Helpers, response formatter, error handler
├── tests/                  # Jest unit & integration tests
├── docker-compose.yml      # MongoDB + Redis + RabbitMQ
└── Dockerfile
```

---

## Kiểm thử

```bash
# Chạy toàn bộ test suite
npm run test

# Watch mode
npm run test:watch
```

Test coverage tập trung vào: `user.service`, `user.routes`, `notification.e2e`.

---

## Triển khai

Hệ thống được deploy trên **DigitalOcean Droplet** (Singapore SGP1) thông qua **Coolify** với CI/CD tự động từ GitHub, HTTPS/SSL tự động, và Docker Compose quản lý các dịch vụ.

```
DigitalOcean Droplet (2 vCPU / 4GB RAM / 80GB SSD)
└── Coolify
    ├── IE213-Backend       → api.unisynchcm.com
    ├── IE213-Frontend      → unisynchcm.com
    ├── MongoDB             (internal network)
    ├── Redis               (internal network)
    └── RabbitMQ            (internal network)
```

---

## Liên kết

- 🔗 **Frontend Repo:** [IE213-Frontend](https://github.com/noahihi203/IE213-Frontend)
- 🎨 **Figma Design:** [UniSync Design System](https://www.figma.com/design/5s1dlHuiRUjFmrCw4vxjGK/UniSync)
- 🌐 **Live Site:** [unisynchcm.com](https://unisynchcm.com)

---

## Nhóm phát triển

Dự án môn **IE213 — Kỹ thuật Phát triển Hệ thống Web**, Trường Đại học Công nghệ Thông tin — ĐHQG TP.HCM.

| Thành viên | MSSV | Vai trò |
|---|---|---|
| Vũ Quang Huy | 22520587 | Trưởng nhóm, DevOps, Backend |
| Bùi Quốc Lâm | 22520733 | Backend, Frontend, Database |
| Nguyễn Trần Hương Giang | 22520359 | UI/UX Design, Frontend, Testing |
| Chung Kiết Lâm | 22520735 | Frontend |
| Châu Trần Vỹ Linh | 22520755 | UI/UX, Content, Báo cáo |

**GVHD:** ThS. Phạm Nhật Duy
