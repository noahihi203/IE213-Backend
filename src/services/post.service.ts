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
import SeoRenderService from "./seo-render.service.js";
import UrlRedirectService from "./url-redirect.service.js";
import CategoryService from "./category.service.js";
import logger from "../config/logger.config.js";

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
  keyword?: string;
  coverImage?: string;
  updatedAt: Date;
  slug?: string;
  status?: PostStatus;
  tags?: Array<Types.ObjectId | string>;
  category?: Types.ObjectId | string;
  titleUpdate?: string;
  contentUpdate?: string;
  excerptUpdate?: string;
  keywordUpdate?: string;
  coverImageUpdate?: string;
  slugUpdate?: string;
  statusUpdate?: PostStatus;
  tagsUpdate?: Array<Types.ObjectId | string> | string;
  categoryUpdate?: Types.ObjectId | string;
}

const VIEW_COUNT_COOLDOWN_SECONDS = 30;
const VIEW_COUNT_COOLDOWN_MS = VIEW_COUNT_COOLDOWN_SECONDS * 1000;
const POST_LIST_CACHE_PREFIX = "posts:list:";
const POST_DETAIL_BY_ID_PREFIX = "posts:detail:id:";
const POST_DETAIL_BY_SLUG_PREFIX = "posts:detail:slug:";
const POST_CATEGORY_CACHE_PREFIX = "posts:category:";
const POST_TRENDING_CACHE_KEY = "posts:trending";

const POST_LIST_CACHE_TTL_SECONDS = 60;
const POST_DETAIL_CACHE_TTL_SECONDS = 120;
const POST_CATEGORY_CACHE_TTL_SECONDS = 90;
const POST_TRENDING_CACHE_TTL_SECONDS = 300;

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

  private static normalizeTagsForKey(
    tags?: Types.ObjectId[] | string[],
  ): string {
    if (!tags || tags.length === 0) return "";

    return tags
      .map((tag) => String(tag))
      .sort((a, b) => a.localeCompare(b))
      .join(",");
  }

  private static buildPostListCacheKey(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    order: "asc" | "desc";
    status?: string;
    authorId?: Types.ObjectId | string;
    category?: Types.ObjectId | string;
    tags?: Types.ObjectId[] | string[];
  }): string {
    const cacheKeyPayload = [
      `p=${params.page}`,
      `l=${params.limit}`,
      `q=${(params.search || "").trim().toLowerCase()}`,
      `sb=${params.sortBy}`,
      `o=${params.order}`,
      `st=${params.status || ""}`,
      `a=${params.authorId ? String(params.authorId) : ""}`,
      `c=${params.category ? String(params.category) : ""}`,
      `t=${PostService.normalizeTagsForKey(params.tags)}`,
    ];

    return `${POST_LIST_CACHE_PREFIX}${cacheKeyPayload.join("|")}`;
  }

  private static async invalidatePostCaches(options?: {
    postId?: Types.ObjectId;
    slug?: string;
    categorySlug?: string;
  }) {
    await redisService.delByPrefix(`${POST_TRENDING_CACHE_KEY}:`);
    await redisService.delByPrefix(POST_LIST_CACHE_PREFIX);
    await redisService.delByPrefix(POST_CATEGORY_CACHE_PREFIX);

    if (options?.postId) {
      await redisService.del(`${POST_DETAIL_BY_ID_PREFIX}${options.postId}`);
    }

    if (options?.slug) {
      await redisService.del(`${POST_DETAIL_BY_SLUG_PREFIX}${options.slug}`);
    }

    if (options?.categorySlug) {
      await redisService.del(
        `${POST_CATEGORY_CACHE_PREFIX}${options.categorySlug}:`,
      );
    }
  }

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

    const cacheKey = PostService.buildPostListCacheKey({
      page: parsedPage,
      limit: parsedLimit,
      search,
      sortBy: parsedSortBy,
      order: parsedOrder,
      status,
      authorId,
      category,
      tags,
    });

    const cachedResult = await redisService.get<{
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>(cacheKey);
    if (cachedResult) return cachedResult;

    const [posts, totalCount] = await Promise.all([
      postModel
        .find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(parsedLimit)
        .populate("category", "icon abbreviation name")
        .populate("authorId", "fullName avatar username")
        .populate("tags", "name")
        .lean(),
      postModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / parsedLimit);
    const hasNextPage = parsedPage < totalPages;
    const hasPrevPage = parsedPage > 1;

    const result = {
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

    await redisService.setWithTTL(
      cacheKey,
      result,
      POST_LIST_CACHE_TTL_SECONDS,
    );

    return result;
  };

  static getLikedPostsWithFilters = async (
    userId: Types.ObjectId | string,
    postQueryParams: PostQueryParams,
  ) => {
    if (!userId) throw new BadRequestError("Missing userId!");

    const { page, limit, search, sortBy, sort, order, status, category, tags } =
      postQueryParams;

    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const parsedSortBy = sortBy || sort || "createdOn";
    const parsedOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc";

    const skip = (parsedPage - 1) * parsedLimit;

    const likedRecords = await likePostModel
      .find({
        userId:
          typeof userId === "string"
            ? convertToObjectIdMongodb(userId)
            : userId,
      })
      .select("targetId")
      .lean();

    const likedPostIds = likedRecords.map((record) => record.targetId);

    if (likedPostIds.length === 0) {
      return {
        data: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: parsedPage > 1,
        },
      };
    }

    const filter: any = {
      _id: { $in: likedPostIds },
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (tags) filter.tags = { $in: tags };

    const sortObject: any = {};
    sortObject[parsedSortBy] = parsedOrder === "asc" ? 1 : -1;

    const [posts, totalCount] = await Promise.all([
      postModel
        .find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(parsedLimit)
        .populate("category", "icon name")
        .populate("authorId", "fullName avatar username")
        .lean(),
      postModel.countDocuments(filter),
    ]);

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

    const cacheKey = `${POST_DETAIL_BY_ID_PREFIX}${postId}`;
    const cachedPost = await redisService.get<any>(cacheKey);
    if (cachedPost) return cachedPost;

    const post = await postModel
      .findOne({ _id: postId })
      .populate("category", "icon name")
      .populate("authorId", "fullName avatar username")
      .lean();

    if (!post) throw new BadRequestError("Post not found!");

    const result = {
      ...post,
      author: post.authorId,
    };

    await redisService.setWithTTL(
      cacheKey,
      result,
      POST_DETAIL_CACHE_TTL_SECONDS,
    );

    return result;
  };

  static getPostBySlug = async (slug: string) => {
    if (!slug) throw new BadRequestError("Missing parameter!");

    const cacheKey = `${POST_DETAIL_BY_SLUG_PREFIX}${slug}`;
    const cachedPost = await redisService.get<any>(cacheKey);
    if (cachedPost) return cachedPost;

    const result = await postModel
      .findOne({ slug })
      .populate("category", "icon abbreviation name")
      .populate("authorId", "fullName avatar username bio")
      .populate("tags", "name slug")
      .lean();

    if (!result) throw new BadRequestError("Post not found!");

    // const result = {
    //   ...post,
    //   author: post.authorId,
    // };

    await redisService.setWithTTL(
      cacheKey,
      result,
      POST_DETAIL_CACHE_TTL_SECONDS,
    );

    return result;
  };

  static getPostBySlugForSeo = async (slug: string) => {
    if (!slug) throw new BadRequestError("Missing parameter!");

    return await postModel
      .findOne({ slug })
      .populate("category", "icon name")
      .populate("authorId", "fullName avatar username")
      .populate("tags", "name slug")
      .lean();
  };

  static createPost = async (postBody: IPost) => {
    const { authorId, title, content, excerpt, category } = postBody;

    // Check dữ liệu đầu vào
    if (!authorId) {
      throw new BadRequestError("AuthorId is required!");
    }
    if (!title) {
      throw new BadRequestError("Tittle is required!");
    }

    const finalSlug = postBody.slug || slugify(postBody.title);

    postBody.slug = finalSlug;

    if (!content) {
      throw new BadRequestError("Content is required!");
    }

    const finalExcerpt = excerpt || content?.substring(0, 200) + "...";
    postBody.excerpt = finalExcerpt;
    if (!category) {
      throw new BadRequestError("Category is required!");
    }

    try {
      const existingPost = await postModel.findOne({
        $or: [{ title }, { slug: finalSlug }],
      });

      if (existingPost) {
        throw new BadRequestError("Post is exist!");
      }

      const createPost = await postModel.create(postBody);
      if (!createPost) throw new BadRequestError("Create post success!");

      const increasePostCount = await this.changePostStatus(
        createPost._id,
        "published",
      );

      if (!increasePostCount)
        throw new BadRequestError("Increase post count failed!");
      return createPost;
    } catch (error) {
      logger.error(error);
      throw new BadRequestError("Create Post failed!");
    }
  };

  static updatePost = async (
    postId: Types.ObjectId,
    updateData: UpdatePostData,
  ) => {
    try {
      if (!postId) throw new BadRequestError("Missing parameter!");
      if (!updateData) throw new BadRequestError("Missing parameter!");

      const beforePost = await postModel.findById(postId);
      if (!beforePost) throw new BadRequestError("Post not found!");

      const normalizedUpdateData: Record<string, any> = {};

      const title = updateData.title ?? updateData.titleUpdate;
      const content = updateData.content ?? updateData.contentUpdate;
      const excerpt = updateData.excerpt ?? updateData.excerptUpdate;
      const keyword = updateData.keyword ?? updateData.keywordUpdate;
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

      if (typeof keyword === "string") {
        normalizedUpdateData.keyword = keyword.trim() || null;
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

      normalizedUpdateData.updatedAt = new Date();

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

      const oldSlug = String(beforePost.slug || "");
      const newSlug = String(updatePost.slug || "");
      if (oldSlug && newSlug && oldSlug !== newSlug) {
        const nextFrontendUrl = SeoRenderService.buildFrontendPostUrl(newSlug);

        await Promise.all([
          UrlRedirectService.upsertRedirect(
            `/posts/${oldSlug}`,
            nextFrontendUrl,
            301,
          ),
          UrlRedirectService.upsertRedirect(
            `/blog/${oldSlug}`,
            nextFrontendUrl,
            301,
          ),
        ]);
      }

      await PostService.invalidatePostCaches({
        postId,
        slug: updatePost.slug || beforePost.slug,
      });

      return updatePost;
    } catch (error) {
      logger.error(error);
      return {};
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

  static getTrendingPosts = async () => {
    const cacheKey = `${POST_TRENDING_CACHE_KEY}`;

    // Dùng hàm có try/catch tương tự CategoryService
    try {
      const cached = await redisService.get<any[]>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      console.warn("Redis get failed, falling back to DB", err);
    }

    const result = await postModel.aggregate([
      { $match: { status: "published" } },
      {
        $addFields: {
          readingTime: {
            $let: {
              vars: {
                wordCount: {
                  $size: {
                    $regexFindAll: {
                      input: { $ifNull: ["$content", ""] },
                      regex: /[^\s]+/,
                    },
                  },
                },
              },
              in: {
                $ceil: { $divide: ["$$wordCount", 200] },
              },
            },
          },
        },
      },
      { $sort: { viewCount: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "Users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorInfo",
        },
      },
      { $unwind: "$authorInfo" },
      {
        $lookup: {
          from: "Categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $lookup: {
          from: "Tags",
          localField: "tags",
          foreignField: "_id",
          as: "tagsInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $project: {
          _id: 0,
          postId: "$_id",
          title: 1,
          excerpt: 1,
          coverImage: 1,
          slug: 1,
          viewCount: 1,
          publishedAt: 1,
          readingTime: {
            $cond: [{ $eq: ["$readingTime", 0] }, 1, "$readingTime"],
          },
          authorName: "$authorInfo.fullName",
          authorAvatar: "$authorInfo.avatar",
          categoryAbbreviation: "$categoryInfo.abbreviation",
          tags: "$tagsInfo",
        },
      },
    ]);

    try {
      await redisService.setWithTTL(
        cacheKey,
        result,
        POST_TRENDING_CACHE_TTL_SECONDS,
      );
    } catch (err) {
      console.warn("Redis set failed", err);
    }

    return result;
  };

  static getPostWithEngagement = async (postId: Schema.Types.ObjectId) => {
    const [postWithEngagemment, users, comments, shares] = await Promise.all([
      postModel
        .findOne({ _id: postId })
        .select("viewCount likesCount sharesCount commentsCount"),
      likePostModel
        .find({ targetId: postId })
        .populate("userId", "fullName avatar")
        .limit(10)
        .sort({ createdAt: -1 }),
      commentModel
        .find({ postId: postId })
        .populate("authorId", "fullName avatar")
        .limit(5)
        .sort({ createdAt: -1 }),
      shareModel.find({ postId: postId }),
    ]);

    return { postWithEngagemment, users, comments, shares };
  };

  static changePostStatus = async (
    postId: Types.ObjectId,
    status: PostStatus,
  ) => {
    if (!postId) throw new BadRequestError("Missing parameter!");
    if (!status) throw new BadRequestError("Status is required!");

    try {
      const changeStatusPost = await postModel.findById(postId);
      if (!changeStatusPost) throw new BadRequestError("Post not found!");
      // Thay đổi status thành published
      if (status === "published") {
        changeStatusPost.status = "published";
        // Tăng Tags Count
        if (changeStatusPost.tags && changeStatusPost.tags.length > 0) {
          const increaseTagsCount = await TagService.updateTagCounts({
            tagIds: changeStatusPost.tags,
            inc: 1,
          });
          if (!increaseTagsCount)
            throw new BadRequestError("Increase Tags count failed!");
        }
        // Tăng Cateogry Count
        const increaseCatCount = await CategoryService.updatePostCatCounts({
          catId: changeStatusPost.category._id,
          inc: 1,
        });
        if (!increaseCatCount)
          throw new BadRequestError("Increase Category count failed");
      }

      // Thay đổi status thành archived hoặc draft
      if (status === "archived" || status === "draft") {
        changeStatusPost.status = status;
        // Giảm Category count xuống 1.
        const decreaseCatCount = await CategoryService.updatePostCatCounts({
          catId: changeStatusPost.category._id,
          inc: -1,
        });
        if (!decreaseCatCount) {
          throw new BadRequestError("Decrease Tags count failed!");
        }
        // Giảm Tags count xuống 1
        const tags = changeStatusPost.tags;
        if (tags && tags.length > 0) {
          const decreaseTagsCount = await TagService.updateTagCounts({
            tagIds: tags,
            inc: -1,
          });
          if (!decreaseTagsCount) {
            throw new BadRequestError("Decrease tag count failed!");
          }
        }
      }

      await PostService.invalidatePostCaches({
        postId,
        slug: changeStatusPost.slug,
      });

      await changeStatusPost.save();
      return changeStatusPost;
    } catch (error) {
      logger.error(error);
      throw new BadRequestError("Change status failed");
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

    const cacheKey = `${POST_CATEGORY_CACHE_PREFIX}${categorySlug}:${page}:${limit}`;
    const cached = await redisService.get<any>(cacheKey);
    if (cached) return cached;

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

    const [posts, totalCount] = await Promise.all([
      postModel
        .find(filter)
        .sort({ publishedAt: -1, createdOn: -1 }) // Sắp xếp bài mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .populate("authorId", "fullName avatar username") // Lấy thông tin tác giả
        .populate("category", "icon name slug abbreviation") // Lấy thông tin category
        .lean(),
      postModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    const result = {
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

    await redisService.setWithTTL(
      cacheKey,
      result,
      POST_CATEGORY_CACHE_TTL_SECONDS,
    );

    return result;
  };
}

export default PostService;
