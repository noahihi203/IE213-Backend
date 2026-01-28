-- =====================================================
-- MONGODB SCHEMA FOR BLOG SYSTEM
-- Tech Stack: MENN (MongoDB, Express, Next.js, Node.js)
-- Note: This is a representation in SQL-like syntax
-- for documentation purposes. Actual implementation
-- will use MongoDB collections with Mongoose schemas.
-- =====================================================

-- =====================================================
-- USERS COLLECTION
-- =====================================================
-- Collection: users
{
  "_id": ObjectId,
  "username": String (required, unique, index),
  "email": String (required, unique, index),
  "password": String (required, hashed),
  "fullName": String (required),
  "avatar": String (default: null),
  "bio": String (default: null),
  "role": String (enum: ['admin', 'user', 'poster'], default: 'user', index),
  "isActive": Boolean (default: true),
  "followers": [ObjectId] (ref: 'User'),
  "following": [ObjectId] (ref: 'User'),
  "createdAt": Date (default: Date.now, index),
  "updatedAt": Date (default: Date.now)
}

-- Indexes for users collection:
-- { email: 1 } UNIQUE
-- { username: 1 } UNIQUE
-- { role: 1 }
-- { createdAt: -1 }

-- =====================================================
-- POSTS COLLECTION
-- =====================================================
-- Collection: posts
{
  "_id": ObjectId,
  "authorId": ObjectId (required, ref: 'User', index),
  "title": String (required),
  "content": String (required),
  "excerpt": String (required),
  "coverImage": String (default: null),
  "slug": String (required, unique, index),
  "status": String (enum: ['draft', 'published', 'archived'], default: 'draft', index),
  "tags": [String] (default: [], index),
  "category": String (required, index),
  "viewCount": Number (default: 0),
  "likesCount": Number (default: 0),
  "commentsCount": Number (default: 0),
  "sharesCount": Number (default: 0),
  "createdAt": Date (default: Date.now, index),
  "updatedAt": Date (default: Date.now),
  "publishedAt": Date (default: null, index)
}

-- Indexes for posts collection:
-- { authorId: 1 }
-- { slug: 1 } UNIQUE
-- { status: 1, publishedAt: -1 } COMPOUND
-- { tags: 1 }
-- { category: 1 }
-- { createdAt: -1 }
-- { title: "text", content: "text" } TEXT SEARCH

-- =====================================================
-- COMMENTS COLLECTION
-- =====================================================
-- Collection: comments
{
  "_id": ObjectId,
  "postId": ObjectId (required, ref: 'Post', index),
  "authorId": ObjectId (required, ref: 'User', index),
  "content": String (required),
  "parentId": ObjectId (default: null, ref: 'Comment', index),
  "likesCount": Number (default: 0),
  "isEdited": Boolean (default: false),
  "createdAt": Date (default: Date.now, index),
  "updatedAt": Date (default: Date.now)
}

-- Indexes for comments collection:
-- { postId: 1, createdAt: -1 } COMPOUND
-- { authorId: 1 }
-- { parentId: 1 }

-- =====================================================
-- LIKES COLLECTION
-- =====================================================
-- Collection: likes
{
  "_id": ObjectId,
  "userId": ObjectId (required, ref: 'User', index),
  "targetId": ObjectId (required, index),
  "targetType": String (enum: ['post', 'comment'], required, index),
  "createdAt": Date (default: Date.now)
}

-- Indexes for likes collection:
-- { userId: 1, targetId: 1, targetType: 1 } UNIQUE COMPOUND
-- { targetId: 1, targetType: 1 } COMPOUND

-- =====================================================
-- SHARES COLLECTION
-- =====================================================
-- Collection: shares
{
  "_id": ObjectId,
  "postId": ObjectId (required, ref: 'Post', index),
  "userId": ObjectId (required, ref: 'User', index),
  "platform": String (enum: ['facebook', 'twitter', 'linkedin', 'internal'], required),
  "message": String (default: null),
  "createdAt": Date (default: Date.now, index)
}

-- Indexes for shares collection:
-- { postId: 1 }
-- { userId: 1 }
-- { createdAt: -1 }

-- =====================================================
-- CATEGORIES COLLECTION
-- =====================================================
-- Collection: categories
{
  "_id": ObjectId,
  "name": String (required, unique, index),
  "slug": String (required, unique, index),
  "description": String (default: null),
  "icon": String (default: null),
  "postCount": Number (default: 0),
  "createdAt": Date (default: Date.now),
  "updatedAt": Date (default: Date.now)
}

-- Indexes for categories collection:
-- { name: 1 } UNIQUE
-- { slug: 1 } UNIQUE

-- =====================================================
-- NOTIFICATIONS COLLECTION
-- =====================================================
-- Collection: notifications
{
  "_id": ObjectId,
  "userId": ObjectId (required, ref: 'User', index),
  "actorId": ObjectId (required, ref: 'User'),
  "type": String (enum: ['like', 'comment', 'share', 'follow', 'mention'], required, index),
  "targetId": ObjectId (required),
  "targetType": String (enum: ['post', 'comment', 'user'], required),
  "message": String (required),
  "isRead": Boolean (default: false, index),
  "createdAt": Date (default: Date.now, index)
}

-- Indexes for notifications collection:
-- { userId: 1, createdAt: -1 } COMPOUND
-- { isRead: 1 }
-- { userId: 1, isRead: 1 } COMPOUND

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- 1. Get all published posts with author info (aggregation)
db.posts.aggregate([
  { $match: { status: 'published' } },
  { $sort: { publishedAt: -1 } },
  { $lookup: {
      from: 'users',
      localField: 'authorId',
      foreignField: '_id',
      as: 'author'
  }},
  { $unwind: '$author' },
  { $project: {
      title: 1,
      excerpt: 1,
      coverImage: 1,
      slug: 1,
      likesCount: 1,
      commentsCount: 1,
      publishedAt: 1,
      'author.username': 1,
      'author.avatar': 1
  }},
  { $limit: 10 }
])

-- 2. Get post with comments and comment authors
db.posts.aggregate([
  { $match: { _id: ObjectId('...') } },
  { $lookup: {
      from: 'users',
      localField: 'authorId',
      foreignField: '_id',
      as: 'author'
  }},
  { $lookup: {
      from: 'comments',
      let: { postId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
        { $sort: { createdAt: -1 } },
        { $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author'
        }},
        { $unwind: '$author' }
      ],
      as: 'comments'
  }}
])

-- 3. Check if user liked a post
db.likes.findOne({
  userId: ObjectId('...'),
  targetId: ObjectId('...'),
  targetType: 'post'
})

-- 4. Get user's feed (posts from followed users)
db.posts.aggregate([
  { $match: {
      authorId: { $in: [/* array of followed user IDs */] },
      status: 'published'
  }},
  { $sort: { publishedAt: -1 } },
  { $lookup: {
      from: 'users',
      localField: 'authorId',
      foreignField: '_id',
      as: 'author'
  }}
])

-- 5. Get trending posts (most likes in last 7 days)
db.posts.aggregate([
  { $match: {
      status: 'published',
      publishedAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
  }},
  { $sort: { likesCount: -1, viewCount: -1 } },
  { $limit: 10 }
])

-- 6. Get unread notifications for user
db.notifications.find({
  userId: ObjectId('...'),
  isRead: false
}).sort({ createdAt: -1 })

-- 7. Search posts by text
db.posts.find({
  $text: { $search: "search query" },
  status: 'published'
}).sort({ score: { $meta: "textScore" } })

-- 8. Get post statistics
db.posts.aggregate([
  { $match: { authorId: ObjectId('...') } },
  { $group: {
      _id: null,
      totalPosts: { $sum: 1 },
      totalLikes: { $sum: '$likesCount' },
      totalComments: { $sum: '$commentsCount' },
      totalShares: { $sum: '$sharesCount' },
      totalViews: { $sum: '$viewCount' }
  }}
])

-- 9. Get popular tags
db.posts.aggregate([
  { $match: { status: 'published' } },
  { $unwind: '$tags' },
  { $group: {
      _id: '$tags',
      count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 20 }
])

-- 10. Get comments with nested replies
db.comments.aggregate([
  { $match: { postId: ObjectId('...'), parentId: null } },
  { $lookup: {
      from: 'comments',
      localField: '_id',
      foreignField: 'parentId',
      as: 'replies'
  }},
  { $lookup: {
      from: 'users',
      localField: 'authorId',
      foreignField: '_id',
      as: 'author'
  }},
  { $sort: { createdAt: -1 } }
])

-- =====================================================
-- VALIDATION RULES (Mongoose Schema Level)
-- =====================================================

-- User:
-- - email: valid email format
-- - password: min 8 characters
-- - username: 3-30 characters, alphanumeric + underscore

-- Post:
-- - title: 5-200 characters
-- - content: min 10 characters
-- - excerpt: max 300 characters
-- - slug: lowercase, hyphen-separated

-- Comment:
-- - content: 1-1000 characters

-- =====================================================
-- BUSINESS LOGIC TRIGGERS
-- =====================================================

-- On Post Like:
-- 1. Create Like document
-- 2. Increment Post.likesCount
-- 3. Create Notification for post author

-- On Post Comment:
-- 1. Create Comment document
-- 2. Increment Post.commentsCount
-- 3. Create Notification for post author

-- On Post Share:
-- 1. Create Share document
-- 2. Increment Post.sharesCount
-- 3. Create Notification for post author

-- On User Follow:
-- 1. Add to User.followers array
-- 2. Add to User.following array
-- 3. Create Notification for followed user

-- On Comment Reply:
-- 1. Create Comment document with parentId
-- 2. Create Notification for parent comment author
