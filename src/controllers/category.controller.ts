import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import CategoryService from "../services/category.service.js";
import { BadRequestError } from "../core/error.response.js";

class CategoryController {
  getAllCategories = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get all category success!",
      metadata: await CategoryService.getAllCategories(),
    }).send(res);
  };

  getFeaturedCategories = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get featured categories success!",
      metadata: await CategoryService.getFeaturedCategories(),
    }).send(res);
  };

  getSingleCategory = async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;

    // Type guard để đảm bảo categoryId là string
    if (Array.isArray(categoryId)) {
      throw new BadRequestError("Invalid category ID format");
    }
    new SuccessResponse({
      message: "Get single category success!",
      metadata: await CategoryService.getCategoryById(categoryId),
    }).send(res);
  };

  getCategoryBySlug = async (req: Request, res: Response) => {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    new SuccessResponse({
      message: "Get category by slug success!",
      metadata: await CategoryService.getCategoryBySlug(slug),
    }).send(res);
  };

  createCategory = async (req: Request, res: Response) => {
    new SuccessResponse({
      message: "Create category success!",
      metadata: await CategoryService.createCategory(req.body),
    }).send(res);
  };

  updateCategory = async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    if (Array.isArray(categoryId)) {
      throw new BadRequestError("Invalid Category Id format!");
    }
    new SuccessResponse({
      message: "Update category success!",
      metadata: await CategoryService.updateCategory(categoryId, req.body),
    }).send(res);
  };

  deleteCategory = async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    if (Array.isArray(categoryId)) {
      throw new BadRequestError("Invalid Category Id format!");
    }
    new SuccessResponse({
      message: "Delete category success!",
      metadata: await CategoryService.deleteCategory(categoryId),
    }).send(res);
  };
}

export default new CategoryController();
