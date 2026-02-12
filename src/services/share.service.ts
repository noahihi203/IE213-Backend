import { Schema } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { IShare, shareModel } from "../models/share.model.js";

class ShareService {
  static createShare = async (shareContent: IShare) => {
    if (!shareContent) throw new BadRequestError("share content is valid");
    return await shareModel.create(shareContent);
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
