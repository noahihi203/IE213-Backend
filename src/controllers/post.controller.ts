import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import PostService from "../services/post.service.js";
import { BadRequestError } from "../core/error.response.js";

class PostController {
  getAllPosts = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get all Post success!",
      metadata: await PostService.getAllPostsWithFilters(req.params),
    }).send(res);
  };

  getSinglePost = async (req: Request, res: Response) => {
    const postId = req.params.postId;
    if (Array.isArray(postId)) {
      throw new BadRequestError("Invalid Post Id format");
    }

    new SuccessResponse({
      message: "Get single post success!",
      metadata: await PostService.getPostById(postId),
    }).send(res);
  };

  getPostBySlug = async (req: Request, res: Response) => {
    const slug = req.params.slug;
    if (Array.isArray(slug)) {
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
}

export default new PostController();
