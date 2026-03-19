import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import PostService from "../services/post.service.js";
import { BadRequestError } from "../core/error.response.js";
import LikeService from "../services/like.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import ShareService from "../services/share.service.js";
import CommentService from "../services/comment.service.js";
import logger from "../config/logger.config.js";

class PostController {
  getAllPosts = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get all Post success!",
      metadata: await PostService.getAllPostsWithFilters(req.query),
    }).send(res);
  };
  
  getPostsByCategorySlug = async (req: Request, res: Response) => {
    const catSlug = req.params.catSlug;
    if (typeof catSlug !== "string")
      throw new BadRequestError("Invalid cat slug format!");
    new SuccessResponse({
      message: "Get all Post by slug success!",
      metadata: await PostService.getPostsByCategorySlug(catSlug),
    }).send(res);
  };

  getSinglePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (typeof postId !== "string") {
      throw new BadRequestError("Invalid Post Id format");
    }

    new SuccessResponse({
      message: "Get single post success!",
      metadata: await PostService.getPostById(postId),
    }).send(res);
  };

  getPostBySlug = async (req: Request, res: Response) => {
    const slug = req.params.slug;
    if (typeof slug !== "string") {
      throw new BadRequestError("Invalid slug format");
    }

    const post = await PostService.getPostBySlug(slug);

    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]?.trim();
    const clientIp = forwardedIp || req.ip || "unknown";

    const rawUserAgent = req.headers["user-agent"];
    const userAgent = Array.isArray(rawUserAgent)
      ? rawUserAgent[0]
      : rawUserAgent || "unknown";

    const userId = req.user?.userId;
    const viewerKey = userId
      ? `user:${userId}`
      : `guest:${clientIp}:${userAgent.slice(0, 120)}`;

    PostService.incrementViewCountOncePerViewer(
      String((post as any)._id),
      viewerKey,
    ).catch((error) => console.error("Failed to increment view count", error));

    new SuccessResponse({
      message: "Get single post success!",
      metadata: post,
    }).send(res);
  };

  getMyPosts = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestError("Authentication !!");
    }

    new SuccessResponse({
      message: "Get my posts success!",
      metadata: await PostService.getAllPostsWithFilters({
        ...req.query,
        authorId: convertToObjectIdMongodb(userId),
      }),
    }).send(res);
  };

  createPost = async (req: Request, res: Response) => {
    const authorId = req.user?.userId;
    if (!authorId) throw new BadRequestError("Authentication !!");
    req.body.authorId = authorId;
    new SuccessResponse({
      message: "Create post success!",
      metadata: await PostService.createPost(req.body),
    }).send(res);
  };

  updatePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (Array.isArray(postId)) {
      throw new BadRequestError("Invalid Post Id format");
    }
    new SuccessResponse({
      message: "Update post success!",
      metadata: await PostService.updatePost(postId, req.body),
    }).send(res);
  };

  deletePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (Array.isArray(postId))
      throw new BadRequestError("Invalid post id format!");

    new SuccessResponse({
      message: "Delete post success!",
      metadata: await PostService.deletePost(postId),
    }).send(res);
  };

  publishPost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (typeof postId !== "string")
      throw new BadRequestError("Invalid post id format!");

    new SuccessResponse({
      message: "Publish post success!",
      metadata: await PostService.changeStatusPostToPublished(
        convertToObjectIdMongodb(postId),
      ),
    }).send(res);
  };

  changePostStatus = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    const status = req.body.status;

    if (typeof postId !== "string")
      throw new BadRequestError("Invalid post id format!");

    if (!status || !["draft", "published", "archived"].includes(status)) {
      throw new BadRequestError("Invalid status!");
    }

    new SuccessResponse({
      message: "Change post status success!",
      metadata: await PostService.changePostStatus(postId, status),
    }).send(res);
  };

  likePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (Array.isArray(postId))
      throw new BadRequestError("Invalid postId format!");

    const userId = req.user?.userId;
    if (!userId) throw new BadRequestError("Invalid userId");

    const likeParams = {
      targetId: convertToObjectIdMongodb(postId),
      userId: convertToObjectIdMongodb(userId),
    };

    logger.debug("likeParams", likeParams);

    new SuccessResponse({
      message: "Like post success!",
      metadata: await LikeService.likePost(likeParams),
    }).send(res);
  };

  unlikePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (Array.isArray(postId))
      throw new BadRequestError("Invalid postId format!");

    const userId = req.user?.userId;
    if (!userId) throw new BadRequestError("Invalid userId");

    const likeParams = {
      targetId: convertToObjectIdMongodb(postId),
      userId: convertToObjectIdMongodb(userId),
    };

    new SuccessResponse({
      message: "Unlike post success!",
      metadata: await LikeService.unLikePost(likeParams),
    }).send(res);
  };

  isPostLikedByUser = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (Array.isArray(postId))
      throw new BadRequestError("Invalid postId format!");

    const userId = req.user?.userId;
    if (!userId) throw new BadRequestError("Invalid userId");

    const likeParams = {
      targetId: convertToObjectIdMongodb(postId),
      userId: convertToObjectIdMongodb(userId),
    };

    new SuccessResponse({
      message: "Get post like status success!",
      metadata: await LikeService.isPostLikeByUser(likeParams),
    }).send(res);
  };

  sharePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (Array.isArray(postId))
      throw new BadRequestError("Invalid postId format!");

    const userId = req.user?.userId;
    if (!userId) throw new BadRequestError("Invalid userId");

    const shareConent = {
      postId: convertToObjectIdMongodb(postId),
      userId: convertToObjectIdMongodb(userId),
      platform: req.body.platform as string,
      message: req.body.message as string,
    };

    new SuccessResponse({
      message: "Share post success!",
      metadata: await ShareService.createShare(shareConent),
    }).send(res);
  };

  getTrendingPosts = async (_req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get trending post success!",
      metadata: await PostService.getTrendingPosts(),
    }).send(res);
  };

  // Lấy các comment của post
  getPostComments = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (typeof postId !== "string")
      throw new BadRequestError("Invalid postId format");

    const parentCommentIdRaw = req.query.parentCommentId;
    const parentCommentId =
      typeof parentCommentIdRaw === "string" && parentCommentIdRaw.trim()
        ? convertToObjectIdMongodb(parentCommentIdRaw)
        : undefined;

    new SuccessResponse({
      message: "Get post comments success!",
      metadata: await CommentService.getCommentByParentId(
        convertToObjectIdMongodb(postId),
        parentCommentId,
      ),
    }).send(res);
  };

  // get số comment của post
  getCommentCount = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (typeof postId !== "string")
      throw new BadRequestError("Invalid postId format");

    const parentCommentIdRaw = req.query.parentCommentId;
    const parentCommentId =
      typeof parentCommentIdRaw === "string" && parentCommentIdRaw.trim()
        ? convertToObjectIdMongodb(parentCommentIdRaw)
        : undefined;

    new SuccessResponse({
      message: "Get comment count success!",
      metadata: await CommentService.getCommentCount(
        convertToObjectIdMongodb(postId),
        parentCommentId,
      ),
    }).send(res);
  };
}

export default new PostController();
