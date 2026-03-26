import { Schema, Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../core/error.response.js";
import { IPost, postModel } from "../models/post.model.js";
import { likePostModel } from "../models/likePost.model.js";
import { commentModel } from "../models/comment.model.js";
import { shareModel } from "../models/share.model.js";
import { userModel } from "../models/user.model.js";
import NotificationService from "./notification.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import TagService from "./tag.service.js";
import { redisService } from "./redis.service.js";
import { categoryModel } from "../models/category.model.js";

interface PostQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string; // ví dụ: 'createdOn', 'publishedAt', 'viewCount'
  sort?: string;
  order?: "asc" | "desc";
  status?: "draft" | "published" | "archived";
  authorId?: Types.ObjectId | string;
  category?: Types.ObjectId | string;
  tags?: Types.ObjectId[] | string[];
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

const VIEW_COUNT_COOLDOWN_SECONDS = 30;
const VIEW_COUNT_COOLDOWN_MS = VIEW_COUNT_COOLDOWN_SECONDS * 1000;

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
  private static recentViewTracker = new Map<string, number>();

  private static hasRecentView = (dedupeKey: string) => {
    const now = Date.now();
    const expireAt = PostService.recentViewTracker.get(dedupeKey) || 0;

    if (expireAt > now) {
      return true;
    }

    PostService.recentViewTracker.set(dedupeKey, now + VIEW_COUNT_COOLDOWN_MS);

    // Keep memory footprint stable when server runs for a long time.
    if (PostService.recentViewTracker.size > 5000) {
      for (const [key, value] of PostService.recentViewTracker.entries()) {
        if (value <= now) {
          PostService.recentViewTracker.delete(key);
        }
      }
    }

    return false;
  };

  static getAllPostsWithFilters = async (postQueryParams: PostQueryParams) => {
    const {
      page,
      limit,
      search,
      sortBy,
      sort,
      order,
      status,
      authorId,
      category,
      tags,
    } = postQueryParams;

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const parsedSortBy = sortBy || sort || "createdOn";
    const parsedOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc";

    const skip = (parsedPage - 1) * parsedLimit;

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
    sortObject[parsedSortBy] = parsedOrder === "asc" ? 1 : -1;

    const posts = await postModel
      .find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(parsedLimit)
      .populate("category", "icon name")
      .populate("authorId", "fullName avatar username")
      .lean();

    const totalCount = await postModel.countDocuments(filter);

    const totalPages = Math.ceil(totalCount / parsedLimit);
    const hasNextPage = parsedPage < totalPages;
    const hasPrevPage = parsedPage > 1;

    return {
      data: posts,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
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

  static incrementViewCountOncePerViewer = async (
    postId: string,
    viewerKey: string,
  ) => {
    if (!postId) throw new BadRequestError("Missing parameter!");

    const safeViewerKey = viewerKey || "anonymous";
    const dedupeKey = `post:view:${postId}:${safeViewerKey}`;

    if (PostService.hasRecentView(dedupeKey)) {
      return null;
    }

    try {
      const cached = await redisService.get<string>(dedupeKey);
      if (cached) {
        return null;
      }
      await redisService.setWithTTL(
        dedupeKey,
        "1",
        VIEW_COUNT_COOLDOWN_SECONDS,
      );
    } catch (error) {
      console.warn("Skip Redis view dedupe, falling back to memory", error);
    }

    return await PostService.incrementViewCount(postId);
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

      // Author là actor của hành động publish
      const authorId = convertToObjectIdMongodb(String(changeStatus.authorId));

      // 3. Gửi thông báo cho từng follower
      if (user && user.followers && user.followers.length > 0) {
        for (const followerId of user.followers) {
          try {
            await NotificationService.notifyOnUser({
              userId: convertToObjectIdMongodb(String(followerId)),
              actorId: authorId,
              type: "newPost",
              message: "published a new post",
              targetType: "post",
              targetId: postId,
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

  static updatePostCommentCount = async (
    postId: string | Types.ObjectId,
    commentCount: number,
  ) => {
    if (!postId) throw new BadRequestError("Missing parameter: postId!");

    // Kiểm tra để đảm bảo commentCount hợp lệ (không bị undefined và không âm)
    if (commentCount === undefined || commentCount < 0) {
      throw new BadRequestError("Invalid comment count!");
    }

    try {
      // Sử dụng toán tử $set để gán thẳng giá trị mới vào commentsCount
      const updatedPost = await postModel.findByIdAndUpdate(
        postId,
        { $set: { commentsCount: commentCount } },
        { new: true },
      );

      if (!updatedPost) {
        throw new BadRequestError(
          "Update comment count failed! Post not found.",
        );
      }

      return updatedPost;
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng comment của bài viết:", error);
      throw error;
    }
  };

  static getPostsByCategorySlug = async (
    categorySlug: string,
    page: number = 1,
    limit: number = 10,
  ) => {
    if (!categorySlug) throw new BadRequestError("Missing category slug!");

    // Bước 1: Tìm Category bằng slug
    const categoryFound = await categoryModel
      .findOne({ slug: categorySlug })
      .lean();
    if (!categoryFound) {
      throw new NotFoundError("Category not found!");
    }

    const skip = (page - 1) * limit;

    // Bước 2: Tìm tất cả Posts có category._id vừa tìm được
    const filter = {
      category: categoryFound._id,
      status: "published", // Thường thì người xem chỉ thấy bài đã publish
    };

    const posts = await postModel
      .find(filter)
      .sort({ publishedAt: -1, createdOn: -1 }) // Sắp xếp bài mới nhất lên đầu
      .skip(skip)
      .limit(limit)
      .populate("authorId", "fullName avatar username") // Lấy thông tin tác giả
      .populate("category", "icon name slug") // Lấy thông tin category
      .lean();

    // Lấy tổng số bài viết để frontend làm phân trang
    const totalCount = await postModel.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      category: categoryFound, // Trả về luôn thông tin category để frontend hiển thị tiêu đề
      posts: posts.map((post: any) => ({
        ...post,
        author: post.authorId, // Map lại tên biến cho chuẩn UI (nếu cần)
      })),
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  };
}

export default PostService;
