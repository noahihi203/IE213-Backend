import { Types } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { IPost, postModel } from "../models/post.model.js";

interface PostQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string; // ví dụ: 'createdOn', 'publishedAt', 'viewCount'
  order?: "asc" | "desc";
  status?: "draft" | "published" | "archived";
  category?: Types.ObjectId;
  tags?: string[];
}

interface updateData {
  titleUpdate: string;
  contentUpdate: string;
  excerptUpdate: string;
  coverImageUpdate: string;
  slugUpdate: string;
  statusUpdate: string;
  tagsUpdate: string; // #chinhtri #lichsu
  categoryUpdate: Types.ObjectId; //{Công Nghệ, }
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
    let { page, limit, search, sortBy, order, status, category, tags } =
      postQueryParams;
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
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (tags) {
      filter.tags = { $in: tags };
    }

    const sortObject: any = {};

    sortObject[sortBy] = order === "asc" ? 1 : -1;

    const posts = await postModel
      .find(filter)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .populate("category")
      .populate("authorId")
      .lean();

    const totalCount: any = postModel.countDocuments(filter);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return posts;
  };
  static getPostById = async (postId: string) => {
    if (!postId) {
      throw new BadRequestError("Missing parameter!");
    }

    const post = await postModel
      .findOne({ _id: postId })
      .populate("category")
      .populate("authorId");
    PostService.incrementViewCount(postId).catch(console.error);

    if (!post) {
      throw new BadRequestError("Post not found!");
    }
    return post;
  };
  static getPostBySlug = async (slug: string) => {
    if (!slug) {
      throw new BadRequestError("Missing parameter!");
    }

    const post = await postModel
      .findOne({ slug: slug })
      .populate("category")
      .populate("authorId");

    const postId = String(post?._id);
    PostService.incrementViewCount(postId).catch(console.error);

    if (!post) {
      throw new BadRequestError("Post not found!");
    }
    return post;
  };
  static createPost = async (postBody: IPost) => {
    const { authorId, title, content, excerpt, category } = postBody;
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

    return await postModel.create(postBody);
  };
  static updatePost = async (postId: string, updateData: updateData) => {
    if (!postId) throw new BadRequestError("Missing parameter!");
    if (!updateData) throw new BadRequestError("Missing parameter!");
    return await postModel.findByIdAndUpdate(
      postId,
      { $set: updateData },
      { new: true, runValidators: true },
    );
  };
  static deletePost = async (postId: string) => {
    if (!postId) throw new BadRequestError("Missing parameter!");
    return await postModel.findByIdAndUpdate(
      postId,
      { status: "archived" },
      { new: true },
    );
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
}

export default PostService;
