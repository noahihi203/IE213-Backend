import { Types } from "mongoose";
import { BadRequestError } from "../core/error.response.js";
import { tagModel } from "../models/tag.model.js";
import { slugify } from "./category.service.js";

interface tagContentInput {
  name: string;
  description: string | "";
}

interface tagUpdateInput {
  tagId: Types.ObjectId;
  name: string;
  description: string | "";
}

interface updateTagCountInput {
  tagIds: Types.ObjectId[];
  inc: number;
}

class TagService {
  static createTag = async (tagContent: tagContentInput) => {
    if (!tagContent) throw new BadRequestError("Missing parameter");

    const { name, description } = tagContent;
    if (typeof name !== "string")
      throw new BadRequestError("Invalid name tag format!");

    const slug = slugify(name);
    if (!slug) throw new BadRequestError("Create slug failed!");

    const tagFinalContent = { name, description, slug };
    const createTag = await tagModel.create(tagFinalContent);
    if (!createTag) throw new BadRequestError("Create tag failed!");

    return createTag;
  };

  static getAllTag = async () => {
    const tags = await tagModel.find({}, "name slug description postCount status");
    if (!tags) throw new BadRequestError("tags not found");

    return tags;
  };

  static getTagById = async (tagId: Types.ObjectId) => {
    if (!tagId) throw new BadRequestError("Missing parameter");

    const tag = await tagModel.findById(tagId);
    if (!tag) throw new BadRequestError("tag not found");

    return tag;
  };

  static updateTag = async (tagUpdateContent: tagUpdateInput) => {
    const { tagId, name, description } = tagUpdateContent;
    const findTag = await tagModel.find({ name: name });
    if (findTag) throw new BadRequestError("tag is ton tai");
    const slug = slugify(name);

    const tagUpdate = await tagModel.findByIdAndUpdate(tagId, {
      $set: {
        name: name,
        description: description,
        slug: slug,
      },
    });

    if (!tagUpdate) throw new BadRequestError("Update tag failed!");

    return tagUpdate;
  };

  static updateStatusTagToActive = async (tagId: Types.ObjectId) => {
    if (!tagId) throw new BadRequestError("Missing parameter");

    const tag = await tagModel.findByIdAndUpdate(tagId, {
      $set: { status: "active" },
    });
    if (!tag) throw new BadRequestError("tag not found");

    return tag;
  };

  static updateStatusTagToInActive = async (tagId: Types.ObjectId) => {
    if (!tagId) throw new BadRequestError("Missing parameter");

    const tag = await tagModel.findByIdAndUpdate(tagId, {
      $set: { status: "inactive" },
    });
    if (!tag) throw new BadRequestError("tag not found");

    return tag;
  };

  static updateTagCounts = async (
    updateTagCountContent: updateTagCountInput,
  ) => {
    const { tagIds, inc } = updateTagCountContent;

    const updatePromises = tagIds.map((tagId) => {
      return tagModel.findByIdAndUpdate(
        tagId,
        { $inc: { postCount: inc } },
        { new: true },
      );
    });

    const results = await Promise.all(updatePromises);

    return results;
  };

  static deleteTag = async (tagId: Types.ObjectId) => {
    if (!tagId) throw new BadRequestError("Missing parameter");
    
    const tagDelete = await tagModel.findByIdAndDelete(tagId);
    if (!tagDelete) throw new BadRequestError("tag not found");

    return { deleteTag: true };
  };
}

export default TagService;
