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

class PostService {
  static getAllPostsWithFilters = async (postQueryParams: any) => {
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

    return posts.map((post: any) => ({
      ...post,
      author: post.authorId,
    }));
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

    if (!authorId) throw new BadRequestError("AuthorId is required!");
    if (!title) throw new BadRequestError("Title is required!");
    if (!content) throw new BadRequestError("Content is required!");
    if (!category) throw new BadRequestError("Category is required!");

    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    postBody.slug = slug;
    postBody.excerpt = excerpt || content.substring(0, 200) + "...";

    const created = await postModel.create(postBody);

    await TagService.updateTagCounts({
      tagIds: tags,
      inc: 1,
    });

    return created;
  };

  static incrementViewCount = async (postId: string) => {
    return await postModel.findByIdAndUpdate(
      postId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
  };

  static getTrendingPosts = async (limit: number = 10) => {
    const CACHE_KEY = "posts:trending";

    const cached = await redisService.get<any[]>(CACHE_KEY);
    if (cached) return cached;

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

    await redisService.setWithTTL(CACHE_KEY, result, 300);

    return result;
  };
}

export default PostService;