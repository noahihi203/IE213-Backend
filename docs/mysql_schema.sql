-- =====================================================
-- MySQL DATABASE SCHEMA FOR BLOG SYSTEM
-- Tech Stack: MENN (MongoDB, Express, Next.js, Node.js)
-- Converted from MongoDB to MySQL
-- =====================================================

-- Drop database if exists and create new
DROP DATABASE IF EXISTS blog_system;
CREATE DATABASE blog_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blog_system;

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password',
    full_name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    role ENUM('admin', 'user', 'poster') NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    icon VARCHAR(500) DEFAULT NULL,
    post_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: posts
-- =====================================================
CREATE TABLE posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    author_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT NOT NULL,
    cover_image VARCHAR(500) DEFAULT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    view_count INT UNSIGNED NOT NULL DEFAULT 0,
    likes_count INT UNSIGNED NOT NULL DEFAULT 0,
    comments_count INT UNSIGNED NOT NULL DEFAULT 0,
    shares_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_author_id (author_id),
    INDEX idx_category_id (category_id),
    INDEX idx_slug (slug),
    INDEX idx_status_published (status, published_at),
    INDEX idx_created_at (created_at),
    INDEX idx_published_at (published_at),
    FULLTEXT INDEX ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: post_tags
-- =====================================================
CREATE TABLE post_tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_tag (tag),
    UNIQUE KEY unique_post_tag (post_id, tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: comments
-- =====================================================
CREATE TABLE comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    parent_id BIGINT UNSIGNED DEFAULT NULL,
    content TEXT NOT NULL,
    likes_count INT UNSIGNED NOT NULL DEFAULT 0,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id_created (post_id, created_at),
    INDEX idx_author_id (author_id),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: likes
-- =====================================================
CREATE TABLE likes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    target_type ENUM('post', 'comment') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_target (target_id, target_type),
    UNIQUE KEY unique_user_target (user_id, target_id, target_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: shares
-- =====================================================
CREATE TABLE shares (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    platform ENUM('facebook', 'twitter', 'linkedin', 'internal') NOT NULL,
    message TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: user_followers
-- =====================================================
CREATE TABLE user_followers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'User being followed',
    follower_id BIGINT UNSIGNED NOT NULL COMMENT 'User who follows',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (user_id, follower_id),
    INDEX idx_user_id (user_id),
    INDEX idx_follower_id (follower_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: notifications
-- =====================================================
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Recipient',
    actor_id BIGINT UNSIGNED NOT NULL COMMENT 'Who triggered the notification',
    type ENUM('like', 'comment', 'share', 'follow', 'mention') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    target_type ENUM('post', 'comment', 'user') NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id_created (user_id, created_at),
    INDEX idx_is_read (is_read),
    INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- =====================================================

-- Insert sample users
INSERT INTO users (username, email, password, full_name, role, bio) VALUES
('admin', 'admin@blog.com', '$2b$10$X5QqP7F8KqZ9H1nY2L3Y5eF7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L', 'Admin User', 'admin', 'System Administrator'),
('johndoe', 'john@example.com', '$2b$10$X5QqP7F8KqZ9H1nY2L3Y5eF7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L', 'John Doe', 'poster', 'Tech blogger and developer'),
('janedoe', 'jane@example.com', '$2b$10$X5QqP7F8KqZ9H1nY2L3Y5eF7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L', 'Jane Doe', 'user', 'Avid reader'),
('techwriter', 'tech@blog.com', '$2b$10$X5QqP7F8KqZ9H1nY2L3Y5eF7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L', 'Tech Writer', 'poster', 'Professional tech writer'),
('alice', 'alice@example.com', '$2b$10$X5QqP7F8KqZ9H1nY2L3Y5eF7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L', 'Alice Smith', 'user', NULL);

-- Insert sample categories
INSERT INTO categories (name, slug, description, post_count) VALUES
('Technology', 'technology', 'All about technology and gadgets', 0),
('Programming', 'programming', 'Software development and coding', 0),
('Web Development', 'web-development', 'Web technologies and frameworks', 0),
('Mobile', 'mobile', 'Mobile app development', 0),
('DevOps', 'devops', 'DevOps practices and tools', 0),
('AI & Machine Learning', 'ai-machine-learning', 'Artificial Intelligence and ML', 0),
('Lifestyle', 'lifestyle', 'Lifestyle and personal development', 0);

-- Insert sample posts
INSERT INTO posts (author_id, category_id, title, content, excerpt, slug, status, view_count, likes_count, comments_count, published_at) VALUES
(2, 2, 'Getting Started with Node.js', 'Node.js is a powerful JavaScript runtime built on Chrome''s V8 engine...', 'Learn the basics of Node.js', 'getting-started-with-nodejs', 'published', 1250, 45, 12, '2026-01-15 10:00:00'),
(2, 3, 'Building REST APIs with Express', 'Express is a minimal and flexible Node.js web application framework...', 'Complete guide to Express.js', 'building-rest-apis-with-express', 'published', 980, 38, 8, '2026-01-18 14:30:00'),
(4, 3, 'Introduction to Next.js 14', 'Next.js 14 brings exciting new features including Server Actions...', 'Explore Next.js 14 features', 'introduction-to-nextjs-14', 'published', 2100, 89, 24, '2026-01-20 09:15:00'),
(2, 2, 'MongoDB vs MySQL: Which to Choose?', 'Choosing between MongoDB and MySQL depends on your use case...', 'Database comparison guide', 'mongodb-vs-mysql-comparison', 'published', 1560, 67, 19, '2026-01-22 16:45:00'),
(4, 1, 'The Future of AI in 2026', 'Artificial Intelligence continues to evolve rapidly...', 'AI trends and predictions', 'future-of-ai-2026', 'draft', 0, 0, 0, NULL);

-- Insert sample tags
INSERT INTO post_tags (post_id, tag) VALUES
(1, 'nodejs'),
(1, 'javascript'),
(1, 'backend'),
(2, 'express'),
(2, 'nodejs'),
(2, 'rest-api'),
(3, 'nextjs'),
(3, 'react'),
(3, 'frontend'),
(4, 'mongodb'),
(4, 'mysql'),
(4, 'database'),
(5, 'ai'),
(5, 'technology');

-- Insert sample comments
INSERT INTO comments (post_id, author_id, content, likes_count) VALUES
(1, 3, 'Great article! Very helpful for beginners.', 5),
(1, 5, 'Thanks for sharing. Looking forward to more Node.js content.', 2),
(2, 3, 'Clear and concise explanation. Bookmarked!', 8),
(3, 2, 'Next.js 14 is amazing! Thanks for the overview.', 12),
(3, 5, 'Can you cover Server Actions in more detail?', 3),
(4, 3, 'Good comparison. I use both depending on the project.', 6);

-- Insert nested comment (reply)
INSERT INTO comments (post_id, author_id, parent_id, content, likes_count) VALUES
(3, 4, 5, 'I''ll create a detailed tutorial on Server Actions soon!', 4);

-- Insert sample likes on posts
INSERT INTO likes (user_id, target_id, target_type) VALUES
(3, 1, 'post'),
(5, 1, 'post'),
(3, 2, 'post'),
(5, 3, 'post'),
(3, 3, 'post'),
(2, 3, 'post'),
(5, 4, 'post'),
(3, 4, 'post');

-- Insert sample likes on comments
INSERT INTO likes (user_id, target_id, target_type) VALUES
(2, 1, 'comment'),
(5, 1, 'comment'),
(2, 3, 'comment');

-- Insert sample shares
INSERT INTO shares (post_id, user_id, platform, message) VALUES
(1, 3, 'twitter', 'Check out this great Node.js tutorial!'),
(3, 5, 'facebook', 'Must-read for Next.js developers'),
(4, 3, 'linkedin', NULL);

-- Insert sample followers
INSERT INTO user_followers (user_id, follower_id) VALUES
(2, 3),  -- Jane follows John
(2, 5),  -- Alice follows John
(4, 3),  -- Jane follows TechWriter
(4, 5),  -- Alice follows TechWriter
(2, 4);  -- TechWriter follows John

-- Insert sample notifications
INSERT INTO notifications (user_id, actor_id, type, target_id, target_type, message, is_read) VALUES
(2, 3, 'like', 1, 'post', 'janedoe liked your post', FALSE),
(2, 3, 'comment', 1, 'post', 'janedoe commented on your post', FALSE),
(2, 5, 'like', 1, 'post', 'alice liked your post', TRUE),
(4, 5, 'follow', 4, 'user', 'alice started following you', FALSE),
(2, 4, 'follow', 2, 'user', 'techwriter started following you', TRUE);

-- =====================================================
-- UPDATE DENORMALIZED COUNTS
-- =====================================================

-- Update posts likes_count, comments_count
UPDATE posts p SET 
    likes_count = (SELECT COUNT(*) FROM likes WHERE target_id = p.id AND target_type = 'post'),
    comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = p.id),
    shares_count = (SELECT COUNT(*) FROM shares WHERE post_id = p.id);

-- Update comments likes_count
UPDATE comments c SET 
    likes_count = (SELECT COUNT(*) FROM likes WHERE target_id = c.id AND target_type = 'comment');

-- Update categories post_count
UPDATE categories cat SET 
    post_count = (SELECT COUNT(*) FROM posts WHERE category_id = cat.id AND status = 'published');

-- =====================================================
-- TRIGGERS (Optional - for automatic count updates)
-- =====================================================

-- Trigger: Increment post likes_count when like is added
DELIMITER //
CREATE TRIGGER after_post_like_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    IF NEW.target_type = 'post' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSEIF NEW.target_type = 'comment' THEN
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    END IF;
END//
DELIMITER ;

-- Trigger: Decrement post likes_count when like is removed
DELIMITER //
CREATE TRIGGER after_post_like_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
    IF OLD.target_type = 'post' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.target_id;
    ELSEIF OLD.target_type = 'comment' THEN
        UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.target_id;
    END IF;
END//
DELIMITER ;

-- Trigger: Increment post comments_count when comment is added
DELIMITER //
CREATE TRIGGER after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
END//
DELIMITER ;

-- Trigger: Decrement post comments_count when comment is deleted
DELIMITER //
CREATE TRIGGER after_comment_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
END//
DELIMITER ;

-- Trigger: Increment post shares_count when share is added
DELIMITER //
CREATE TRIGGER after_share_insert
AFTER INSERT ON shares
FOR EACH ROW
BEGIN
    UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
END//
DELIMITER ;

-- Trigger: Update category post_count when post status changes
DELIMITER //
CREATE TRIGGER after_post_status_update
AFTER UPDATE ON posts
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        IF OLD.status = 'published' AND OLD.category_id IS NOT NULL THEN
            UPDATE categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
        END IF;
        IF NEW.status = 'published' AND NEW.category_id IS NOT NULL THEN
            UPDATE categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
        END IF;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all published posts with author info
-- SELECT p.*, u.username, u.full_name, u.avatar, c.name as category_name
-- FROM posts p
-- JOIN users u ON p.author_id = u.id
-- LEFT JOIN categories c ON p.category_id = c.id
-- WHERE p.status = 'published'
-- ORDER BY p.published_at DESC
-- LIMIT 10;

-- Get post with all comments (including nested)
-- SELECT p.*, 
--        c.id as comment_id, c.content as comment_content, 
--        cu.username as commenter_username
-- FROM posts p
-- LEFT JOIN comments c ON p.id = c.post_id
-- LEFT JOIN users cu ON c.author_id = cu.id
-- WHERE p.id = 1;

-- Get trending posts (most likes in last 7 days)
-- SELECT p.*, u.username, COUNT(l.id) as recent_likes
-- FROM posts p
-- JOIN users u ON p.author_id = u.id
-- LEFT JOIN likes l ON p.id = l.target_id AND l.target_type = 'post' 
--                   AND l.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
-- WHERE p.status = 'published'
-- GROUP BY p.id
-- ORDER BY recent_likes DESC, p.view_count DESC
-- LIMIT 10;

-- Get user's feed (posts from followed users)
-- SELECT p.*, u.username, u.full_name, u.avatar
-- FROM posts p
-- JOIN users u ON p.author_id = u.id
-- WHERE p.author_id IN (
--     SELECT user_id FROM user_followers WHERE follower_id = 3
-- ) AND p.status = 'published'
-- ORDER BY p.published_at DESC;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
