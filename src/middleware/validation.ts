import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ForBiddenError } from "../core/error.response.js";
import { ObjectId } from "mongodb";

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
  email: z.email("Email không đúng format!").nonempty(),
  password: z
    .string()
    .min(8, "Mật khẩu phải ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Phải có ít nhất 1 chữ cái viết hoa")
    .regex(/[a-z]/, "Phải có ít nhất 1 chữ cái viết thường")
    .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt (@, $, !, ...)"),
});

const UpdateProfileInput = z.object({
  fullName: z.string().nonempty().min(2, "Họ và tên phải có lớn hơn 2 ký tự"),
  avatar: z.url({ message: "Đường dẫn avatar không hợp lệ" }),
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
  authorId: z.string().nonempty(),
  title: z
    .string()
    .nonempty()
    .min(5, "Title không được ít hơn 5 ký tự")
    .max(200, "Title không được quá 200 ký tự"),
  content: z.string().nonempty(),
  excerpt: z.string(),
  category: z.string(),
});

const UpdatePostInput = z.object({
  titleUpdate: z.string(),
  contentUpdate: z.string(),
  excerptUpdate: z.string(),
  coverImageUpdate: z.string(),
  slugUpdate: z.string(),
  statusUpdate: z.string(),
  tagsUpdate: z.string(), // #chinhtri #lichsu
  categoryUpdate: z.string(), //{Công Nghệ, }
});

const CommentInput = z.object({
  postId: z.instanceof(ObjectId),
  userId: z.instanceof(ObjectId),
  content: z
    .string()
    .nonempty()
    .min(1, "Content không được ít hơn 1 ký tự")
    .max(2000, "Content không được quá 2000 ký tự"),
  parentCommentId: z.instanceof(ObjectId),
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

export const validateRegisterInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const registerInput = req.body;

    const result = await RegisterInput.safeParse(registerInput);

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
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

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
  }
};

export const validateUpdateUserInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updateInput = req.body;

    const result = await UpdateProfileInput.safeParse(updateInput);

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
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

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
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

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
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

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
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

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
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

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
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

    if (!result.success) console.log(result.error);
    else console.log(result.data);
  } catch {
    throw new ForBiddenError("Error in validation");
  } finally {
    next();
  }
};
