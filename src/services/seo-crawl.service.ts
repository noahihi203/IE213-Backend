import { postModel } from "../models/post.model.js";
import { seoSettingModel } from "../models/seo-setting.model.js";
import SeoRenderService from "./seo-render.service.js";

const ROBOTS_SETTING_KEY = "robots_txt";

class SeoCrawlService {
  private static typeSitemapEntry(entry: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
  }) {
    return entry;
  }

  private static xmlEscape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private static getFrontendBaseUrl(): string {
    return process.env.FRONTEND_URL || "http://localhost:3000";
  }

  private static buildAbsoluteUrl(path: string): string {
    return new URL(path, SeoCrawlService.getFrontendBaseUrl()).toString();
  }

  static buildCanonicalUrlFromAbsolute(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.search = "";
      parsed.hash = "";
      if (parsed.pathname.length > 1) {
        parsed.pathname = parsed.pathname.replace(/\/+$/, "");
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }

  static async buildSitemapXml(): Promise<string> {
    const posts = await postModel
      .find({ status: "published" })
      .select("slug modifiedOn createdOn")
      .sort({ modifiedOn: -1, createdOn: -1 })
      .lean();

    const staticUrls = [
      SeoCrawlService.typeSitemapEntry({
        loc: SeoCrawlService.buildAbsoluteUrl("/"),
        changefreq: "daily",
        priority: "1.0",
      }),
      SeoCrawlService.typeSitemapEntry({
        loc: SeoCrawlService.buildAbsoluteUrl("/posts"),
        changefreq: "hourly",
        priority: "0.9",
      }),
      SeoCrawlService.typeSitemapEntry({
        loc: SeoCrawlService.buildAbsoluteUrl("/categories"),
        changefreq: "daily",
        priority: "0.8",
      }),
    ];

    const postUrls = posts.map((post: any) =>
      SeoCrawlService.typeSitemapEntry({
        loc: SeoRenderService.buildFrontendPostUrl(post.slug),
        lastmod: (
          post.modifiedOn ||
          post.createdOn ||
          new Date()
        ).toISOString(),
        changefreq: "daily",
        priority: "0.8",
      }),
    );

    const allUrls = [...staticUrls, ...postUrls];

    const urlEntries = allUrls
      .map((entry) => {
        const loc = SeoCrawlService.xmlEscape(
          SeoCrawlService.buildCanonicalUrlFromAbsolute(entry.loc),
        );
        const lastmod = entry.lastmod
          ? `<lastmod>${SeoCrawlService.xmlEscape(entry.lastmod)}</lastmod>`
          : "";
        const changefreq = entry.changefreq
          ? `<changefreq>${SeoCrawlService.xmlEscape(entry.changefreq)}</changefreq>`
          : "";
        const priority = entry.priority
          ? `<priority>${SeoCrawlService.xmlEscape(entry.priority)}</priority>`
          : "";

        return `<url><loc>${loc}</loc>${lastmod}${changefreq}${priority}</url>`;
      })
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`;
  }

  static async buildSitemapIndexXml(): Promise<string> {
    const sitemapUrl = SeoCrawlService.buildAbsoluteUrl("/sitemap.xml");

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SeoCrawlService.xmlEscape(sitemapUrl)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  static buildDefaultRobotsTxt(): string {
    const siteBase = SeoCrawlService.getFrontendBaseUrl();
    const sitemapUrl = new URL("/sitemap.xml", siteBase).toString();

    return `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /login
Disallow: /register

Sitemap: ${sitemapUrl}
`;
  }

  static async getRobotsTxt(): Promise<string> {
    const setting = await seoSettingModel
      .findOne({ key: ROBOTS_SETTING_KEY })
      .select("value")
      .lean();

    return setting?.value || SeoCrawlService.buildDefaultRobotsTxt();
  }

  static async updateRobotsTxt(content: string): Promise<string> {
    const normalizedContent = content.trim();

    await seoSettingModel.findOneAndUpdate(
      { key: ROBOTS_SETTING_KEY },
      { $set: { value: normalizedContent } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return normalizedContent;
  }
}

export default SeoCrawlService;
