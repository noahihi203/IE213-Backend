import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import PostService from "../services/post.service.js";
import { BadRequestError } from "../core/error.response.js";
import LikeService from "../services/like.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import { Schema } from "mongoose";
import ShareService from "../services/share.service.js";

class PostController {
  getAllPosts = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get all Post success!",
      metadata: await PostService.getAllPostsWithFilters(req.query),
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

    new SuccessResponse({
      message: "Get single post success!",
      metadata: await PostService.getPostBySlug(slug),
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

    console.log("likeParams", likeParams);

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

  getTrendingPosts = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get trending post success!",
      metadata: await PostService.getTrendingPosts(),
    }).send(res);
  };
}

export default new PostController();
