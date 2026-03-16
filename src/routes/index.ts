import express from "express";
import accessRouter from "./access/index.js";
import userRouter from "./user/index.js";
import categoryRouter from "./category/index.js";
import commentRouter from "./comment/index.js";
import tagRouter from "./tag/index.js";
import notificationRouter from "./notification/index.js";
import postRouter from "./post/index.js";
import adminRouter from "./admin/index.js";
const router = express.Router();
import { apiKey, permission } from "../auth/checkAuth.js";

router.use("/v1/api", accessRouter);

// check api key
router.use(apiKey);
// check permission
router.use(permission("0000"));

router.use("/v1/api/categories", categoryRouter);
router.use("/v1/api/tags", tagRouter);
router.use("/v1/api/comments", commentRouter);
router.use("/v1/api/notifications", notificationRouter);
router.use("/v1/api/posts", postRouter);
router.use("/v1/api/user", userRouter);
router.use("/v1/api/admin", adminRouter);
export default router;
