/**
 * =============================================================================
 * AUTHENTICATION ENDPOINTS
 * =============================================================================
 */

/**
 * @swagger
 * /v1/api/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyen Van A
 *                 description: Tên đầy đủ của người dùng
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email đăng ký (phải unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: SecurePass123!
 *                 description: Mật khẩu (tối thiểu 6 ký tự)
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registered OK!
 *                 status:
 *                   type: number
 *                   example: 201
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /v1/api/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login success!
 *                 status:
 *                   type: number
 *                   example: 200
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           description: Token hết hạn sau 2 ngày
 *                         refreshToken:
 *                           type: string
 *                           description: Token hết hạn sau 7 ngày
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 *       404:
 *         description: User không tồn tại
 */

/**
 * @swagger
 * /v1/api/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /v1/api/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token nhận được khi login
 *     responses:
 *       200:
 *         description: Token làm mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */

/**
 * =============================================================================
 * POST ENDPOINTS
 * =============================================================================
 */

/**
 * @swagger
 * /v1/api/posts:
 *   get:
 *     summary: Lấy danh sách tất cả bài viết (Public)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bài viết mỗi trang
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Lọc theo category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Lọc theo tác giả
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: number
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         totalPages:
 *                           type: number
 */

/**
 * @swagger
 * /v1/api/posts/trending:
 *   get:
 *     summary: Lấy danh sách bài viết trending (Public)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bài viết trending
 *     responses:
 *       200:
 *         description: Lấy bài viết trending thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 */

/**
 * @swagger
 * /v1/api/posts/{postId}:
 *   get:
 *     summary: Lấy chi tiết bài viết theo ID (Public)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Lấy bài viết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Bài viết không tồn tại
 */

/**
 * @swagger
 * /v1/api/posts/slug/{slug}:
 *   get:
 *     summary: Lấy bài viết theo slug (Public)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Post slug (URL-friendly)
 *         example: my-first-blog-post
 *     responses:
 *       200:
 *         description: Lấy bài viết thành công
 *       404:
 *         description: Bài viết không tồn tại
 */

/**
 * @swagger
 * /v1/api/posts:
 *   post:
 *     summary: Tạo bài viết mới (Author/Admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Tiêu đề bài viết của tôi
 *               content:
 *                 type: string
 *                 example: Nội dung chi tiết của bài viết...
 *               categoryId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 default: draft
 *               slug:
 *                 type: string
 *                 description: URL-friendly slug (tự động sinh nếu không cung cấp)
 *                 example: tieu-de-bai-viet-cua-toi
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (phải là Author hoặc Admin)
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /v1/api/posts/{postId}:
 *   put:
 *     summary: Cập nhật bài viết (Author/Admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (chỉ tác giả hoặc admin)
 *       404:
 *         description: Bài viết không tồn tại
 */

/**
 * @swagger
 * /v1/api/posts/{postId}:
 *   delete:
 *     summary: Xóa bài viết (Author/Admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa bài viết thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Bài viết không tồn tại
 */

/**
 * @swagger
 * /v1/api/posts/{postId}/like:
 *   post:
 *     summary: Like bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     likesCount:
 *                       type: number
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /v1/api/posts/{postId}/like:
 *   delete:
 *     summary: Unlike bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unlike thành công
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /v1/api/posts/{postId}/share:
 *   post:
 *     summary: Chia sẻ bài viết
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chia sẻ thành công
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * =============================================================================
 * COMMENT ENDPOINTS
 * =============================================================================
 */

/**
 * @swagger
 * /v1/api/comments:
 *   post:
 *     summary: Tạo comment mới
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - content
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               content:
 *                 type: string
 *                 example: Bài viết rất hay và bổ ích!
 *               parentCommentId:
 *                 type: string
 *                 description: ID của comment cha (để reply comment)
 *                 example: 507f1f77bcf86cd799439012
 *     responses:
 *       201:
 *         description: Tạo comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bài viết không tồn tại
 */

/**
 * @swagger
 * /v1/api/comments/{commentId}:
 *   get:
 *     summary: Lấy chi tiết comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment không tồn tại
 */

/**
 * @swagger
 * /v1/api/comments:
 *   put:
 *     summary: Cập nhật nội dung comment (chỉ comment của mình)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentId
 *               - content
 *             properties:
 *               commentId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               content:
 *                 type: string
 *                 example: Nội dung comment đã chỉnh sửa
 *     responses:
 *       200:
 *         description: Cập nhật comment thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (chỉ sửa comment của mình)
 *       404:
 *         description: Comment không tồn tại
 */

/**
 * @swagger
 * /v1/api/comments:
 *   delete:
 *     summary: Xóa comment và tất cả reply
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentId
 *               - postId
 *             properties:
 *               commentId:
 *                 type: string
 *               postId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xóa comment thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Comment hoặc Post không tồn tại
 */

/**
 * @swagger
 * /v1/api/comments/{commentId}/like:
 *   post:
 *     summary: Toggle like/unlike comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Toggle like thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                       description: true nếu đã like, false nếu đã unlike
 *                     likesCount:
 *                       type: number
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Comment không tồn tại
 */

/**
 * @swagger
 * /v1/api/comments/{commentId}/report:
 *   post:
 *     summary: Báo cáo comment vi phạm
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Spam hoặc nội dung không phù hợp
 *     responses:
 *       200:
 *         description: Báo cáo thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Comment không tồn tại
 */

/**
 * =============================================================================
 * CATEGORY ENDPOINTS
 * =============================================================================
 */

/**
 * @swagger
 * /v1/api/categories:
 *   get:
 *     summary: Lấy danh sách tất cả categories (Public)
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /v1/api/categories/{categoryId}:
 *   get:
 *     summary: Lấy chi tiết category theo ID (Public)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category không tồn tại
 */

/**
 * @swagger
 * /v1/api/categories/slug/{slug}:
 *   get:
 *     summary: Lấy category theo slug (Public)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: technology
 *     responses:
 *       200:
 *         description: Lấy category thành công
 *       404:
 *         description: Category không tồn tại
 */

/**
 * @swagger
 * /v1/api/categories:
 *   post:
 *     summary: Tạo category mới (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Technology
 *               description:
 *                 type: string
 *                 example: Các bài viết về công nghệ
 *               slug:
 *                 type: string
 *                 description: URL-friendly slug (tự động sinh nếu không cung cấp)
 *                 example: technology
 *     responses:
 *       201:
 *         description: Tạo category thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (Admin only)
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /v1/api/categories/{categoryId}:
 *   put:
 *     summary: Cập nhật category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               slug:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật category thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (Admin only)
 *       404:
 *         description: Category không tồn tại
 */

/**
 * @swagger
 * /v1/api/categories/{categoryId}:
 *   delete:
 *     summary: Xóa category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa category thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (Admin only)
 *       404:
 *         description: Category không tồn tại
 */

/**
 * =============================================================================
 * USER ENDPOINTS
 * =============================================================================
 */

/**
 * @swagger
 * /v1/api/user/{userId}:
 *   get:
 *     summary: Lấy thông tin profile user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: User không tồn tại
 */

/**
 * @swagger
 * /v1/api/user/{userId}:
 *   put:
 *     summary: Cập nhật profile (chỉ profile của mình hoặc Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 example: newemail@example.com
 *               bio:
 *                 type: string
 *                 example: Software Developer
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: User không tồn tại
 */

/**
 * @swagger
 * /v1/api/user/users:
 *   get:
 *     summary: Lấy danh sách tất cả users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, moderator, user]
 *         description: Lọc theo role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái active
 *     responses:
 *       200:
 *         description: Lấy danh sách users thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (Admin only)
 */

/**
 * @swagger
 * /v1/api/user/{userId}:
 *   delete:
 *     summary: Xóa user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa user thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (Admin only)
 *       404:
 *         description: User không tồn tại
 */

/**
 * @swagger
 * /v1/api/user/{userId}/role:
 *   put:
 *     summary: Thay đổi role của user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, user]
 *                 example: moderator
 *     responses:
 *       200:
 *         description: Thay đổi role thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền hoặc vi phạm policy
 *       404:
 *         description: User không tồn tại
 */

/**
 * @swagger
 * /v1/api/user/comments:
 *   get:
 *     summary: Lấy danh sách comments của user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - clientId: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách comments thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 metadata:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: User không tồn tại
 */

// Export để TypeScript không báo lỗi
export default {};
