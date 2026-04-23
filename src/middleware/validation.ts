import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ValidationError } from "../core/error.response.js";
import logger from "../config/logger.config.js";

const RegisterInput = z.object({
  username: z
    .string()
    .min(3, "username phải có lớn hơn 3 ký tự")
    .max(30, "username không được quá 30 ký tự")
    .nonempty(),
  email: z.email("Email không đúng format!").nonempty(),
  fullName: z.string().nonempty().min(2, "Họ và tên phải có lớn hơn 2 ký tự"),
  password: z
    .string()
    .min(8, "Mật khẩu phải ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Phải có ít nhất 1 chữ cái viết hoa")
    .regex(/[a-z]/, "Phải có ít nhất 1 chữ cái viết thường")
    .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt (@, $, !, ...)"),
});

const LoginInput = z.object({
  email: z.string().email("Email hoặc mật khẩu không chính xác").nonempty(),
  password: z.string().min(1, "Email hoặc mật khẩu không chính xác"),
});

const VerifyEmailInput = z.object({
  token: z.string().nonempty("Token là bắt buộc"),
});

const ForgotPasswordInput = z.object({
  email: z.email("Email không đúng format!").nonempty(),
});

const ResetPasswordInput = z.object({
  token: z.string().nonempty("Token là bắt buộc"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu phải ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Phải có ít nhất 1 chữ cái viết hoa")
    .regex(/[a-z]/, "Phải có ít nhất 1 chữ cái viết thường")
    .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt (@, $, !, ...)"),
});

const UpdateProfileInput = z.object({
  fullName: z.string().nonempty().min(2, "Họ và tên phải có lớn hơn 2 ký tự"),
  avatar: z.string().url("Đường dẫn avatar không hợp lệ").or(z.literal("")),
  bio: z.string().max(500, "Bio không được dài quá 500 ký tự"),
});

const UpdateEmailInput = z.object({
  newEmail: z.email("Email không đúng format!").nonempty(),
  currentPassword: z
    .string()
    .min(8, "Mật khẩu phải ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Phải có ít nhất 1 chữ cái viết hoa")
    .regex(/[a-z]/, "Phải có ít nhất 1 chữ cái viết thường")
    .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt (@, $, !, ...)"),
});

const UpdateUsernameInput = z.object({
  newUsername: z.string().nonempty(),
});

const PostInput = z.object({
  authorId: z.string().optional(),
  title: z
    .string()
    .nonempty()
    .min(5, "Title không được ít hơn 5 ký tự")
    .max(200, "Title không được quá 200 ký tự"),
  content: z.string().nonempty(),
  excerpt: z.string(),
  keyword: z.string().optional(),
  category: z.string(),
});

const UpdatePostInput = z
  .object({
    title: z.string().min(5).max(200).optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    keyword: z.string().optional(),
    coverImage: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    titleUpdate: z.string().optional(),
    contentUpdate: z.string().optional(),
    excerptUpdate: z.string().optional(),
    keywordUpdate: z.string().optional(),
    coverImageUpdate: z.string().optional(),
    slugUpdate: z.string().optional(),
    statusUpdate: z.enum(["draft", "published", "archived"]).optional(),
    tagsUpdate: z.union([z.string(), z.array(z.string())]).optional(),
    categoryUpdate: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const CommentInput = z.object({
  postId: z.string().nonempty("postId là bắt buộc"),
  content: z
    .string()
    .nonempty()
    .min(1, "Content không được ít hơn 1 ký tự")
    .max(2000, "Content không được quá 2000 ký tự"),
  parentCommentId: z.string().optional(),
});

const CategoryInput = z.object({
  name: z
    .string()
    .min(2, "Name không được ít hơn 2 ký tự")
    .max(50, "Name không được quá 50 ký tự"),
  slug: z.string(),
  description: z.string(),
  icon: z.string(),
  postCount: z.number(),
});

const CreateTagInput = z.object({
  name: z
    .string()
    .min(2, "Tag name không được ít hơn 2 ký tự")
    .max(50, "Tag name không được quá 50 ký tự")
    .nonempty(),
  description: z.string(),
});

export const validateRegisterInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const registerInput = req.body;
    const result = await RegisterInput.safeParse(registerInput);

    if (!result.success) {
      // Changed .errors to .issues here
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    } else {
      logger.debug(result.data);
      return next();
    }
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateLoginInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const loginInput = req.body;
    const result = await LoginInput.safeParse(loginInput);

    if (!result.success) {
      const errorMessage = "Email hoặc mật khẩu không chính xác";
      logger.error(
        `Login validation failed: ${result.error.issues[0]?.message}`,
      );
      return next(new ValidationError(errorMessage));
    } else {
      logger.debug(result.data);
      return next();
    }
  } catch {
    return next(new ValidationError("Email hoặc mật khẩu không chính xác"));
  }
};
export const validateVerifyEmailInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const verifyInput = req.body;
    const result = await VerifyEmailInput.safeParse(verifyInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateForgotPasswordInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const forgotInput = req.body;
    const result = await ForgotPasswordInput.safeParse(forgotInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateResetPasswordInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const resetInput = req.body;
    const result = await ResetPasswordInput.safeParse(resetInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

// ===================================================================

export const validateUpdateUserInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updateInput = req.body;
    const result = await UpdateProfileInput.safeParse(updateInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateUpdateUserEmailInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updateInput = req.body;
    const result = await UpdateEmailInput.safeParse(updateInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateUpdateUsernameInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updateInput = req.body;
    const result = await UpdateUsernameInput.safeParse(updateInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validatePostInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postInput = req.body;
    const result = await PostInput.safeParse(postInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    } else {
      logger.debug(result.data);
      return next();
    }
  } catch (error) {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateUpdatePostInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updatePostInput = req.body;
    const result = await UpdatePostInput.safeParse(updatePostInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch (error) {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateCommentInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const commentInput = req.body;
    const result = await CommentInput.safeParse(commentInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    }

    logger.debug(result.data);
    return next();
  } catch (_error) {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateCategoryInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categoryInput = req.body;
    const result = await CategoryInput.safeParse(categoryInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    } else {
      logger.debug(result.data);
      return next();
    }
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};

export const validateCreateTagInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const createTagInput = req.body;
    const result = await CreateTagInput.safeParse(createTagInput);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      logger.error(errorMessage);
      return next(new ValidationError(errorMessage));
    } else {
      logger.debug(result.data);
      return next();
    }
  } catch {
    return next(new ValidationError("Lỗi xác thực dữ liệu"));
  }
};
