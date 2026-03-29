import { Request, Response } from "express";
import { SuccessResponse } from "../core/success.response.js";
import { BadRequestError } from "../core/error.response.js";
import SeoCrawlService from "../services/seo-crawl.service.js";

class SeoAdminController {
  getRobotsTxt = async (_req: Request, res: Response) => {
    new SuccessResponse({
      message: "Get robots.txt configuration success",
      metadata: {
        content: await SeoCrawlService.getRobotsTxt(),
      },
    }).send(res);
  };

  updateRobotsTxt = async (req: Request, res: Response) => {
    const content = req.body?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new BadRequestError("robots.txt content is required");
    }

    new SuccessResponse({
      message: "Update robots.txt configuration success",
      metadata: {
        content: await SeoCrawlService.updateRobotsTxt(content),
      },
    }).send(res);
  };
}

export default new SeoAdminController();
