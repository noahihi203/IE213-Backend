import { Schema } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { IShare, shareModel } from "../models/share.model.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import NotificationService from "./notification.service.js";

class ShareService {
  static createShare = async (shareContent: IShare) => {
    if (!shareContent) throw new BadRequestError("share content is invalid"); // Sửa thành invalid

    // 1. Await ngay lúc khởi tạo để tái sử dụng biến session
    const session = await shareModel.startSession();

    // 2. Thêm () để THỰC THI hàm
    session.startTransaction();

    try {
      // create với mảng truyền vào sẽ trả về một mảng các document
      const share = await shareModel.create([shareContent], {
        session: session,
      });

      if (!share || share.length === 0)
        throw new BadRequestError("Create share failed!");

      if (typeof shareContent.postId !== "string")
        throw new BadRequestError("Invalid postId format!");

      await NotificationService.notifyOnPost({
        postId: convertToObjectIdMongodb(shareContent.postId),
        actorId: shareContent.userId,
        type: "share",
        message: "share your post",
      });

      // 3. Commit transaction
      await session.commitTransaction();

      // Nên return lại data sau khi tạo thành công thay vì không return gì
      return share[0];
    } catch (error) {
      // 4. Nếu có lỗi xảy ra, hủy transaction
      await session.abortTransaction();

      // 5. NÉM LỖI RA NGOÀI để Controller bắt được và trả về HTTP 400/500
      throw error;
    } finally {
      // 6. Luôn luôn kết thúc session
      await session.endSession();
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
