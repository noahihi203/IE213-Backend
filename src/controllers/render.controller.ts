import { Request, Response } from "express";
import PostService from "../services/post.service.js";
import SeoRenderService from "../services/seo-render.service.js";

class RenderController {
  private getUserAgent(req: Request): string {
    const ua = req.headers["user-agent"];
    if (Array.isArray(ua)) return ua[0] || "";
    return ua || "";
  }

  private applySeoCacheHeader(res: Response) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=120, s-maxage=120, stale-while-revalidate=300",
    );
  }

  private async renderPostHtmlBySlug(slug: string): Promise<string> {
    const post = await PostService.getPostBySlug(slug);
    return SeoRenderService.renderPostDocument(post as any);
  }

  renderPostSSR = async (req: Request, res: Response) => {
    const rawSlug = req.params.slug;
    const slug = String(
      Array.isArray(rawSlug) ? rawSlug[0] || "" : rawSlug || "",
    );

    if (!slug) {
      return res.status(400).type("text/html").send("<h1>Invalid slug</h1>");
    }

    try {
      const html = await this.renderPostHtmlBySlug(slug);
      this.applySeoCacheHeader(res);
      return res.status(200).type("text/html").send(html);
    } catch {
      return res
        .status(404)
        .type("text/html")
        .send(SeoRenderService.renderPostNotFound(slug));
    }
  };

  renderPostDynamic = async (req: Request, res: Response) => {
    const rawSlug = req.params.slug;
    const slug = String(
      Array.isArray(rawSlug) ? rawSlug[0] || "" : rawSlug || "",
    );

    if (!slug) {
      return res.status(400).type("text/html").send("<h1>Invalid slug</h1>");
    }

    const rawRenderMode = req.query.render;
    const renderMode = String(
      Array.isArray(rawRenderMode)
        ? rawRenderMode[0] || ""
        : rawRenderMode || "",
    );
    const forceSSR = renderMode.toLowerCase() === "ssr";
    const userAgent = this.getUserAgent(req);
    const isBot = SeoRenderService.isBotUserAgent(userAgent);

    if (!forceSSR && !isBot) {
      return res.redirect(302, SeoRenderService.buildFrontendPostUrl(slug));
    }

    try {
      const html = await this.renderPostHtmlBySlug(slug);
      this.applySeoCacheHeader(res);
      return res.status(200).type("text/html").send(html);
    } catch {
      return res
        .status(404)
        .type("text/html")
        .send(SeoRenderService.renderPostNotFound(slug));
    }
  };
}

export default new RenderController();
