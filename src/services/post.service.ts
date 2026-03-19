import { Schema, Types } from "mongoose";
import { BadRequestError, ForBiddenError } from "../core/error.response.js";
import { IPost, postModel } from "../models/post.model.js";
import { likePostModel } from "../models/likePost.model.js";
import { commentModel } from "../models/comment.model.js";
import { shareModel } from "../models/share.model.js";
import { userModel } from "../models/user.model.js";
import NotificationService from "./notification.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import TagService from "./tag.service.js";
import { redisService } from "./redis.service.js";

interface PostQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string; // ví dụ: 'createdOn', 'publishedAt', 'viewCount'
  order?: "asc" | "desc";
  status?: "draft" | "published" | "archived";
  authorId?: Types.ObjectId;
  category?: Types.ObjectId;
  tags?: Types.ObjectId[];
}

type PostStatus = "draft" | "published" | "archived";

interface UpdatePostData {
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  slug?: string;
  status?: PostStatus;
  tags?: Array<Types.ObjectId | string>;
  category?: Types.ObjectId | string;
  titleUpdate?: string;
  contentUpdate?: string;
  excerptUpdate?: string;
  coverImageUpdate?: string;
  slugUpdate?: string;
  statusUpdate?: PostStatus;
  tagsUpdate?: Array<Types.ObjectId | string> | string;
  categoryUpdate?: Types.ObjectId | string;
}

interface notifyOnUserPayload {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: "follow";
  message: string;
}

function slugify(string: string) {
  if (!string || string.trim() === "") {
    throw new BadRequestError("Cannot slugify empty string");
  } else {
    return string
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split("")
      .map((character) => (/[a-z0-9]/.test(character) ? character : "-"))
      .join("")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

class PostService {
  static getAllPostsWithFilters = async (postQueryParams: PostQueryParams) => {
    let {
      page,
      limit,
      search,
      sortBy,
      order,
      status,
      authorId,
      category,
      tags,
    } = postQueryParams;

    page = page || 1;
    limit = limit || 10;
    sortBy = sortBy || "createdOn";
    order = order || "desc";

    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (authorId) filter.authorId = authorId;
    if (category) filter.category = category;
    if (tags) filter.tags = { $in: tags };

    const sortObject: any = {};
    sortObject[sortBy] = order === "asc" ? 1 : -1;

    const posts = await postModel
      .find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .populate("category", "icon name")
      .populate("authorId", "fullName avatar username")
      .lean();

    const totalCount: any = postModel.countDocuments(filter);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return posts;
  };

  static getPostById = async (postId: string) => {
    if (!postId) throw new BadRequestError("Missing parameter!");

    const post = await postModel
      .findOne({ _id: postId })
      .populate("category", "icon name")
      .populate("authorId", "fullName avatar username")
      .lean();

    if (!post) throw new BadRequestError("Post not found!");

    return {
      ...post,
      author: post.authorId,
    };
  };

  static getPostBySlug = async (slug: string) => {
    if (!slug) throw new BadRequestError("Missing parameter!");

    const post = await postModel
      .findOne({ slug })
      .populate("category", "icon name")
      .populate("authorId", "fullName avatar username")
      .populate("tags", "name slug")
      .lean();

    if (!post) throw new BadRequestError("Post not found!");

    const postId = String(post._id);
    PostService.incrementViewCount(postId).catch(console.error);

    return {
      ...post,
      author: post.authorId,
    };
  };

  static createPost = async (postBody: IPost) => {
    const { authorId, title, content, excerpt, category, tags } = postBody;

    if (!authorId) {
      throw new BadRequestError("AuthorId is required!");
    }

    if (!title) {
      throw new BadRequestError("Tittle is required!");
    }

    const finalSlug = postBody.slug || slugify(postBody.title);

    const existingPost = await postModel.findOne({
      $or: [{ title }, { finalSlug }],
    });

    if (existingPost) {
      throw new BadRequestError("Post is exist!");
    }
    postBody.slug = finalSlug;

    if (!content) {
      throw new BadRequestError("Content is required!");
    }

    const finalExcerpt = excerpt || content?.substring(0, 200) + "...";
    postBody.excerpt = finalExcerpt;
    if (!category) {
      throw new BadRequestError("Category is required!");
    }

    const createPost = await postModel.create(postBody);
    if (!createPost) throw new BadRequestError("Create post success!");

    const updatePostCount = await TagService.updateTagCounts({
      tagIds: tags,
      inc: 1,
    });
    if (!updatePostCount)
      throw new BadRequestError("Update post count for tag failed!");

    return createPost;
  };

  static updatePost = async (postId: string, updateData: UpdatePostData) => {
    if (!postId) throw new BadRequestError("Missing parameter!");
    if (!updateData) throw new BadRequestError("Missing parameter!");

    const beforePost = await postModel.findById(postId);
    if (!beforePost) throw new BadRequestError("Post not found!");

    const normalizedUpdateData: Record<string, any> = {};

    const title = updateData.title ?? updateData.titleUpdate;
    const content = updateData.content ?? updateData.contentUpdate;
    const excerpt = updateData.excerpt ?? updateData.excerptUpdate;
    const coverImage = updateData.coverImage ?? updateData.coverImageUpdate;
    const slug = updateData.slug ?? updateData.slugUpdate;
    const status = updateData.status ?? updateData.statusUpdate;
    const category = updateData.category ?? updateData.categoryUpdate;
    const tags = updateData.tags ?? updateData.tagsUpdate;

    if (typeof title === "string" && title.trim()) {
      normalizedUpdateData.title = title.trim();
      normalizedUpdateData.slug = slugify(title);
    }

    if (typeof content === "string") {
      normalizedUpdateData.content = content;
    }

    if (typeof excerpt === "string") {
      normalizedUpdateData.excerpt = excerpt;
    }

    if (typeof coverImage === "string") {
      normalizedUpdateData.coverImage = coverImage;
    }

    if (typeof slug === "string" && slug.trim()) {
      normalizedUpdateData.slug = slugify(slug);
    }

    if (status) {
      normalizedUpdateData.status = status;
    }

    if (category) {
      normalizedUpdateData.category =
        typeof category === "string"
          ? convertToObjectIdMongodb(category)
          : category;
    }

    if (tags !== undefined) {
      const rawTags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [];

      normalizedUpdateData.tags = rawTags.map((tagId) =>
        typeof tagId === "string" ? convertToObjectIdMongodb(tagId) : tagId,
      );
    }

    if (Object.keys(normalizedUpdateData).length === 0) {
      throw new BadRequestError("No valid fields to update!");
    }

    if (normalizedUpdateData.slug) {
      const existingPost = await postModel.findOne({
        slug: normalizedUpdateData.slug,
        _id: { $ne: postId },
      });

      if (existingPost) {
        throw new BadRequestError("Slug already exists!");
      }
    }

    const updatePost = await postModel.findByIdAndUpdate(
      postId,
      { $set: normalizedUpdateData },
      { new: true, runValidators: true },
    );

    if (!updatePost) throw new BadRequestError("Update post failed!");

    if (Array.isArray(normalizedUpdateData.tags)) {
      const oldTags = beforePost.tags || [];
      const newTags = normalizedUpdateData.tags as Types.ObjectId[];

      const oldTagIds = new Set(oldTags.map((id) => String(id)));
      const newTagIds = new Set(newTags.map((id) => String(id)));

      const tagsToRemove = oldTags.filter((id) => !newTagIds.has(String(id)));
      const tagsToAdd = newTags.filter((id) => !oldTagIds.has(String(id)));

      if (tagsToAdd.length > 0) {
        await TagService.updateTagCounts({
          tagIds: tagsToAdd,
          inc: 1,
        });
      }

      if (tagsToRemove.length > 0) {
        await TagService.updateTagCounts({
          tagIds: tagsToRemove,
          inc: -1,
        });
      }
    }

    return updatePost;
  };

  static deletePost = async (postId: string) => {
    if (!postId) throw new BadRequestError("Missing parameter!");

    try {
      // 1. Chuyển trạng thái bài viết thành "archived" (Xóa mềm)
      const deletePost = await postModel.findByIdAndUpdate(
        postId,
        { status: "archived" },
        { new: true }, // Cần new: true để lấy ra danh sách tags mới nhất
      );

      if (!deletePost) {
        throw new BadRequestError("Delete post failed! Post not found.");
      }

      const tagsToRemove = deletePost.tags;

      // 2. Giảm số lượng đếm (count) của các tags tương ứng
      if (tagsToRemove && tagsToRemove.length > 0) {
        const removeTag = await TagService.updateTagCounts({
          tagIds: tagsToRemove,
          inc: -1,
        });

        if (!removeTag) {
          throw new BadRequestError("Remove tag failed!");
        }
      }

      // Trả về kết quả cho Controller
      return deletePost;
    } catch (error) {
      // Bắt và ném lỗi ra ngoài để Controller xử lý trả về HTTP Error
      console.error("Lỗi khi xóa (archive) bài viết:", error);
      throw error;
    }
  };

  static incrementViewCount = async (postId: string) => {
    if (!postId) {
      throw new BadRequestError("Missing parameter!");
    }

    return await postModel.findByIdAndUpdate(
      postId,
      { $inc: { viewCount: 1 } }, // Tăng viewCount lên 1
      { new: true },
    );
  };

  static updateTrendingScores = async () => {
    const recentPosts = await postModel.find({
      status: "published",
      publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const now = Date.now();
    for (const post of recentPosts) {
      const ageInHours = (now - post.publishedAt.getTime()) / (1000 * 60 * 60);
      const engagementScore =
        post.viewCount +
        post.likesCount * 5 +
        post.commentsCount * 10 +
        post.sharesCount * 20;
      const trendingScore = engagementScore / Math.pow(ageInHours + 2, 1.5);

      await postModel.updateOne({ _id: post._id }, { trendingScore });
    }
  };

  static getTrendingPosts = async (limit: number = 10) => {
    const CACHE_KEY = "posts:trending";

    // Dùng hàm có try/catch tương tự CategoryService
    try {
      const cached = await redisService.get<any[]>(CACHE_KEY);
      if (cached) return cached;
    } catch (err) {
      console.warn("Redis get failed, falling back to DB", err);
    }

    const posts = await postModel
      .find({ status: "published" })
      .sort({ trendingScore: -1 })
      .limit(limit)
      .populate("authorId", "fullName avatar username")
      .populate("category", "icon name")
      .lean();

    const result = posts.map((post: any) => ({
      ...post,
      author: post.authorId,
    }));

    try {
      await redisService.setWithTTL(CACHE_KEY, result, 300);
    } catch (err) {
      console.warn("Redis set failed", err);
    }

    return result;
  };

  static getPostWithEngagement = async (postId: Schema.Types.ObjectId) => {
    const postWithEngagemment = await postModel
      .findOne({ _id: postId })
      .select("viewCount likesCount sharesCount commentsCount");

    // Lấy 10 users LIKE GẦN NHẤT (mới nhất)
    const users = await likePostModel
      .find({ targetId: postId })
      .populate("userId", "fullName avatar")
      .limit(10)
      .sort({ createdAt: -1 });

    // Lấy 5 comment gần đây nhất
    const comments = await commentModel
      .find({ postId: postId })
      .populate("authorId", "fullName avatar")
      .limit(5)
      .sort({ createdAt: -1 });

    const shares = await shareModel.find({ postId: postId });

    return { postWithEngagemment, users, comments, shares };
  };

  static changePostStatus = async (postId: string, status: PostStatus) => {
    if (!postId) throw new BadRequestError("Missing parameter!");
    if (!status) throw new BadRequestError("Status is required!");

    if (status === "published") {
      return await PostService.changeStatusPostToPublished(
        convertToObjectIdMongodb(postId),
      );
    }

    if (status === "archived") {
      return await PostService.deletePost(postId);
    }

    const updatedPost = await postModel.findByIdAndUpdate(
      postId,
      { status: "draft", publishedAt: null },
      { new: true },
    );

    if (!updatedPost) throw new BadRequestError("Change status failed!");

    return updatedPost;
  };

  static changeStatusPostToPublished = async (postId: Types.ObjectId) => {
    try {
      // 1. Cập nhật trạng thái bài viết (Bỏ session)
      const changeStatus = await postModel.findByIdAndUpdate(
        postId,
        { status: "published" },
        { new: true }, // Trả về document mới sau khi update
      );

      if (!changeStatus) {
        throw new BadRequestError("Change status failed! Post not found.");
      }

      const tagsToAdd = changeStatus.tags;

      // 2. Giảm số lượng đếm (count) của các tags tương ứng
      if (tagsToAdd && tagsToAdd.length > 0) {
        const removeTag = await TagService.updateTagCounts({
          tagIds: tagsToAdd,
          inc: 1,
        });

        if (!removeTag) {
          throw new BadRequestError("Remove tag failed!");
        }
      }

      // 2. Lấy danh sách follower của tác giả (Bỏ session)
      const user = await userModel
        .findOne({ _id: changeStatus.authorId })
        .select("followers");

      // Chuyển đổi ID an toàn
      const userId = convertToObjectIdMongodb(String(changeStatus.authorId));

      // 3. Gửi thông báo cho từng follower
      if (user && user.followers && user.followers.length > 0) {
        for (const followerId of user.followers) {
          try {
            await NotificationService.notifyOnUser({
              userId,
              actorId: followerId,
              type: "newPost",
              message: "published a new post",
            });
          } catch (err) {
            // Lỗi ở 1 follower sẽ không làm chết toàn bộ tiến trình
            console.error(`Failed to notify follower ${followerId}`, err);
          }
        }
      }

      return changeStatus;
    } catch (error) {
      // Bắt mọi lỗi xảy ra và ném lên trên để Controller xử lý (trả về HTTP 500/400)
      console.error("Lỗi khi chuyển status bài viết:", error);
      throw error;
    }
  };
}

export default PostService;
