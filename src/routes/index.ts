import express from "express";
import accessRouter from "./access/index.js";
import userRouter from "./user/index.js"
const router = express.Router();
// import { apiKey, permission } from "../auth/checkAuth";
// import { pushToLogDiscord } from "../middlewares/index";
router.use("/v1/api", accessRouter);
router.use("/v1/api", userRouter);
export default router;
