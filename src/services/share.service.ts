import { Schema } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { IShare, shareModel } from "../models/share.model.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import NotificationService from "./notification.service.js";

class ShareService {
  static createShare = async (shareContent: IShare) => {
    if (!shareContent) throw new BadRequestError("share content is invalid");

    try {
      // 1. Dùng .create() truyền thẳng object vào, không cần mảng [] và session nữa
      const share = await shareModel.create(shareContent);

      if (!share) {
        throw new BadRequestError("Create share failed!");
      }

      await NotificationService.notifyOnPost({
        postId: shareContent.postId,
        actorId: shareContent.userId,
        type: "share",
        message: "share your post",
      });
      // 3. Trả về trực tiếp document vừa tạo (vì không dùng mảng nên không cần return share[0])
      return share;
    } catch (error) {
      // Bắt lỗi và ném ra ngoài cho Controller xử lý
      throw error;
    }
  };

  static getPostSharesCount = async (postId: Schema.Types.ObjectId) => {
    if (!postId) throw new BadRequestError("postId is invalid"); // Sửa thành invalid
    return await shareModel.countDocuments({ postId: postId });
  };

  static getUserShares = async (userId: Schema.Types.ObjectId) => {
    if (!userId) throw new BadRequestError("userId is invalid"); // Sửa thành invalid
    return await shareModel
      .find({ userId: userId })
      .populate("postId", "authorId title coverImage");
  };
}

export default ShareService;
