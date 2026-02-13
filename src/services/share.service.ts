import { Schema } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { IShare, shareModel } from "../models/share.model.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import NotificationService from "./notification.service.js";

class ShareService {
  static createShare = async (shareContent: IShare) => {
    if (!shareContent) throw new BadRequestError("share content is valid");

    const session = shareModel.startSession();
    (await session).startTransaction;
    try {
      const share = await shareModel.create([shareContent], {
        session: await session,
      });

      if (!share) throw new BadRequestError("Create share failed!");

      if (typeof shareContent.postId !== "string")
        throw new BadRequestError("Invalid postId format!");

      await NotificationService.notifyOnPost({
        postId: convertToObjectIdMongodb(shareContent.postId),
        actorId: shareContent.userId,
        type: "share",
        message: "share your post",
      });

      (await session).commitTransaction();
    } catch (error) {
      (await session).abortTransaction();
      return;
    } finally {
      (await session).endSession();
    }
  };

  static getPostSharesCount = async (postId: Schema.Types.ObjectId) => {
    if (!postId) throw new BadRequestError("postId is valid");
    return await shareModel.countDocuments({ postId: postId });
  };

  static getUserShares = async (userId: Schema.Types.ObjectId) => {
    if (!userId) throw new BadRequestError("userId is valid");
    return await shareModel
      .find({ userId: userId })
      .populate("postId", "authorId title coverImage");
  };
}

export default ShareService;
