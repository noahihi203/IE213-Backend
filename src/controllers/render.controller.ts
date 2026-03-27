import { Request, Response } from "express";
import PostService from "../services/post.service.js";
import SeoRenderService from "../services/seo-render.service.js";
import UrlRedirectService from "../services/url-redirect.service.js";
import SeoCrawlService from "../services/seo-crawl.service.js";

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

  private applyCanonicalHeader(res: Response, canonicalUrl: string) {
    res.setHeader("Link", `<${canonicalUrl}>; rel=\"canonical\"`);
  }

  private async renderPostHtmlBySlug(slug: string): Promise<string> {
    const post = await PostService.getPostBySlugForSeo(slug);

    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    if (post.status === "archived") {
      throw new Error("POST_GONE");
    }

    if (post.status !== "published") {
      throw new Error("POST_NOT_FOUND");
    }

    return SeoRenderService.renderPostDocument(post as any);
  }

  private async tryHistoricalRedirect(req: Request, res: Response) {
    const redirect = await UrlRedirectService.resolveRedirect(req.path);
    if (!redirect) return null;

    return res.redirect(redirect.statusCode, redirect.toUrl);
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
      this.applyCanonicalHeader(
        res,
        SeoRenderService.buildFrontendPostUrl(slug),
      );
      this.applySeoCacheHeader(res);
      return res.status(200).type("text/html").send(html);
    } catch (error) {
      if ((error as Error).message === "POST_GONE") {
        return res
          .status(410)
          .type("text/html")
          .send(SeoRenderService.renderPostGone(slug));
      }

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
      return res.redirect(301, SeoRenderService.buildFrontendPostUrl(slug));
    }

    try {
      const html = await this.renderPostHtmlBySlug(slug);
      this.applyCanonicalHeader(
        res,
        SeoRenderService.buildFrontendPostUrl(slug),
      );
      this.applySeoCacheHeader(res);
      return res.status(200).type("text/html").send(html);
    } catch (error) {
      if ((error as Error).message === "POST_GONE") {
        return res
          .status(410)
          .type("text/html")
          .send(SeoRenderService.renderPostGone(slug));
      }

      const redirectResponse = await this.tryHistoricalRedirect(req, res);
      if (redirectResponse) return redirectResponse;

      return res
        .status(404)
        .type("text/html")
        .send(SeoRenderService.renderPostNotFound(slug));
    }
  };

  getSitemapXml = async (_req: Request, res: Response) => {
    const xml = await SeoCrawlService.buildSitemapXml();
    this.applySeoCacheHeader(res);
    return res.status(200).type("application/xml").send(xml);
  };

  getSitemapIndexXml = async (_req: Request, res: Response) => {
    const xml = await SeoCrawlService.buildSitemapIndexXml();
    this.applySeoCacheHeader(res);
    return res.status(200).type("application/xml").send(xml);
  };

  getRobotsTxt = async (_req: Request, res: Response) => {
    const content = await SeoCrawlService.getRobotsTxt();
    this.applySeoCacheHeader(res);
    return res.status(200).type("text/plain").send(content);
  };
}

export default new RenderController();
