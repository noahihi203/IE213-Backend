import { Types } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { categoryModel } from "../models/category.model.js";
import { redisService } from "./redis.service.js";
import { postModel } from "../models/post.model.js";

const CACHE_KEY = "categories:list";

interface category {
  name: string;
  slug: string;
  description: string;
  icon: string;
  postCount: number;
}

interface updatePostCatCountInput {
  catId: Types.ObjectId;
  inc: number;
}

export function slugify(string: string) {
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

class CategoryService {
  private static async safeRedisGet<T>(key: string): Promise<T | null> {
    try {
      return await redisService.get<T>(key);
    } catch {
      return null;
    }
  }

  private static async safeRedisSetWithTTL(
    key: string,
    value: any,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await redisService.setWithTTL(key, value, ttlSeconds);
    } catch {
      // ignore cache errors
    }
  }

  private static async safeRedisDel(key: string | string[]): Promise<void> {
    try {
      await redisService.del(key);
    } catch {
      // ignore cache errors
    }
  }

  private static async safeRedisPublish(
    channel: string,
    message: any,
  ): Promise<void> {
    try {
      await redisService.publish(channel, message);
    } catch {
      // ignore cache errors
    }
  }

  static getAllCategories = async () => {
    let categories: category[] = [];
    const cached = await CategoryService.safeRedisGet<any[]>(CACHE_KEY);
    if (cached) return cached;
    categories = await categoryModel.find({}, "_id slug description icon name");
    if (!categories) {
      throw new BadRequestError("category not exist!");
    }
    await CategoryService.safeRedisSetWithTTL(CACHE_KEY, categories, 3600); // 1 giờ
    return categories;
  };

  static getFeaturedCategories = async () => {
    const result = await categoryModel.aggregate([
      {
        $lookup: {
          from: "Posts",
          localField: "_id",
          foreignField: "category",
          as: "posts",
        },
      },
      {
        $addFields: {
          postCount: { $size: "$posts" },
        },
      },
      {
        $sort: { postCount: -1 },
      },
      {
        $limit: 3,
      },
      {
        $addFields: {
          topPost: {
            $arrayElemAt: [
              {
                $slice: [
                  {
                    $sortArray: {
                      input: "$posts",
                      sortBy: { views: -1 },
                    },
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          icon: 1,
          postCount: 1,
          topPost: 1,
        },
      },
    ]);

    return result;
  };

  static getCategoryById = async (categoryId: string) => {
    if (!categoryId) {
      throw new BadRequestError("categoryId not exist!");
    }
    return await categoryModel.findById(categoryId);
  };

  static getCategoryBySlug = async (slug: string) => {
    if (!slug) {
      throw new BadRequestError("Slug not existed!");
    }
    return await categoryModel.findOne({ slug: slug });
  };

  static createCategory = async (catBody: category) => {
    const { name, description, icon } = catBody;

    // 1. Validate required fields
    if (!name || name.trim() === "") {
      throw new BadRequestError("Category name is required!");
    }

    // 2. Validate name length
    if (name.length < 2 || name.length > 100) {
      throw new BadRequestError(
        "Category name must be between 2-100 characters!",
      );
    }

    // 3. Generate slug from name
    const slug = slugify(name);

    // 4. Check if category with same name or slug already exists
    const existingCategory = await categoryModel.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      throw new BadRequestError("Category with this name already exists!");
    }

    // 5. Validate optional fields
    if (description && description.length > 500) {
      throw new BadRequestError("Description must not exceed 500 characters!");
    }

    if (icon && !icon.match(/^https?:\/\/.+/)) {
      throw new BadRequestError("Icon must be a valid URL!");
    }

    // 6. Create category (postCount defaults to 0 in schema)

    const newCategory = await categoryModel.create({
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      icon: icon?.trim() || "",
    });
    // 1. Xóa cache trên Redis
    await CategoryService.safeRedisDel(CACHE_KEY);

    // 2. Publish sự kiện để các instances khác biết (Nếu bạn có dùng Memory Cache cục bộ)
    await CategoryService.safeRedisPublish("CACHE_INVALIDATION", CACHE_KEY);

    return newCategory;
  };

  static updateCategory = async (categoryId: string, updateData: category) => {
    const name = updateData.name;
    const description = updateData.description;
    const icon = updateData.icon;
    // 1. Validate required fields
    if (!name || name.trim() === "") {
      throw new BadRequestError("Category name is required!");
    } else {
      const slug = slugify(name);
      // 2. Validate name length
      if (name.length < 2 || name.length > 100) {
        throw new BadRequestError(
          "Category name must be between 2-100 characters!",
        );
      }

      // 3. Generate slug from name

      // 4. Check if category with same name or slug already exists
      const existingCategory = await categoryModel.findOne({
        $or: [{ name }, { slug }],
      });
      if (slug) {
        updateData = {
          ...updateData,
          slug,
        };
      }
      if (existingCategory) {
        throw new BadRequestError("Category with this name already exists!");
      }
    }

    // 5. Validate optional fields
    if (description && description.length > 500) {
      throw new BadRequestError("Description must not exceed 500 characters!");
    }

    if (icon && !icon.match(/^https?:\/\/.+/)) {
      throw new BadRequestError("Icon must be a valid URL!");
    }

    const updateCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    // 1. Xóa cache trên Redis
    await CategoryService.safeRedisDel(CACHE_KEY);

    // 2. Publish sự kiện để các instances khác biết (Nếu bạn có dùng Memory Cache cục bộ)
    await CategoryService.safeRedisPublish("CACHE_INVALIDATION", CACHE_KEY);

    if (!updateCategory) {
      throw new BadRequestError("User not found!");
    } else {
      return updateCategory;
    }
  };

  static deleteCategory = async (categoryId: string) => {
    // 1. Validate categoryId
    if (!categoryId) {
      throw new BadRequestError("Category ID is required!");
    }

    // 2. Check if category exists
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      throw new BadRequestError("Category not found!");
    }

    // 3. Check if category has posts (using postCount)
    if (category.postCount > 0) {
      throw new BadRequestError(
        `Cannot delete category with ${category.postCount} existing posts! Please reassign or delete posts first.`,
      );
    }

    // 4. Delete the category
    const deletedCategory = await categoryModel.findByIdAndDelete(categoryId);

    // 1. Xóa cache trên Redis
    await CategoryService.safeRedisDel(CACHE_KEY);

    // 2. Publish sự kiện để các instances khác biết (Nếu bạn có dùng Memory Cache cục bộ)
    await CategoryService.safeRedisPublish("CACHE_INVALIDATION", CACHE_KEY);

    return deletedCategory;
  };

  static updatePostCatCounts = async (
    updatePostCatCountContent: updatePostCatCountInput,
  ) => {
    const { catId, inc } = updatePostCatCountContent;

    return categoryModel.findByIdAndUpdate(
      catId,
      { $inc: { postCount: inc } },
      { new: true },
    );
  };

  static getCategoryPostCount = async (categoryId: Types.ObjectId) => {
    if (!categoryId) {
      throw new BadRequestError("Category ID is required!");
    }

    const category = await categoryModel
      .findOne({ _id: categoryId })
      .select("postCount");

    if (!category) {
      throw new BadRequestError("Category not found!");
    }

    return category;
  };
}

export default CategoryService;
