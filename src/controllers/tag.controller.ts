import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import TagService from "../services/tag.service.js";
import { convertToObjectIdMongodb } from "../utils/index.js";
import { BadRequestError } from "../core/error.response.js";

class TagController {
  createTag = async (req: Request, res: Response) => {
    return new SuccessResponse({
      message: "Create tag success!",
      metadata: await TagService.createTag(req.body),
    }).send(res);
  };

  getTagById = async (req: Request, res: Response) => {
    const tagId = req.params.tagId;
    if (typeof tagId !== "string")
      throw new BadRequestError("Invalid tag id format!");
    return new SuccessResponse({
      message: "Get tag by id success!",
      metadata: await TagService.getTagById(convertToObjectIdMongodb(tagId)),
    }).send(res);
  };

  updateTag = async (req: Request, res: Response) => {
    return new SuccessResponse({
      message: "Update tag success!",
      metadata: await TagService.updateTag(req.body),
    }).send(res);
  };

  updateStatusTagToActive = async (req: Request, res: Response) => {
    const tagId = req.params.tagId;
    if (typeof tagId !== "string")
      throw new BadRequestError("Invalid tag id format!");
    return new SuccessResponse({
      message: "Update status tag to active!",
      metadata: await TagService.updateStatusTagToActive(
        convertToObjectIdMongodb(tagId),
      ),
    }).send(res);
  };

  updateStatusTagToInActive = async (req: Request, res: Response) => {
    const tagId = req.params.tagId;
    if (typeof tagId !== "string")
      throw new BadRequestError("Invalid tag id format!");
    return new SuccessResponse({
      message: "Update status tag to inactive!",
      metadata: await TagService.updateStatusTagToInActive(
        convertToObjectIdMongodb(tagId),
      ),
    }).send(res);
  };

  updateTagCounts = async (req: Request, res: Response) => {
    return new SuccessResponse({
      message: "Update tag count success!",
      metadata: await TagService.updateTagCounts(req.body),
    }).send(res);
  };

  deleteTag = async (req: Request, res: Response) => {
    const tagId = req.params.tagId;
    if (typeof tagId !== "string")
      throw new BadRequestError("Invalid tag id format!");
    return new SuccessResponse({
      message: "Delete tag success!",
      metadata: await TagService.deleteTag(convertToObjectIdMongodb(tagId)),
    }).send(res);
  };
}

export default new TagController();
