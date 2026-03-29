type AuthorLike = {
  fullName?: string;
  username?: string;
};

type CategoryLike = {
  name?: string;
};

type TagLike = {
  name?: string;
  slug?: string;
};

type RenderablePost = {
  slug: string;
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  publishedAt?: string | Date | null;
  modifiedOn?: string | Date | null;
  createdOn?: string | Date | null;
  author?: AuthorLike;
  authorId?: AuthorLike;
  category?: CategoryLike;
  tags?: TagLike[];
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewCount?: number;
};

const BOT_USER_AGENT_PATTERN =
  /googlebot|bingbot|yandexbot|duckduckbot|baiduspider|slurp|facebookexternalhit|twitterbot|linkedinbot|rogerbot|embedly|quora link preview|slackbot|whatsapp|telegrambot|discordbot|applebot/i;

class SeoRenderService {
  private static getSiteName(): string {
    return process.env.SEO_SITE_NAME || "IE213 Blog";
  }

  private static getLocale(): string {
    return process.env.SEO_OG_LOCALE || "vi_VN";
  }

  private static normalizeAbsoluteUrl(rawUrl: string): string {
    const parsed = new URL(rawUrl);
    parsed.search = "";
    parsed.hash = "";

    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }

    return parsed.toString();
  }

  static isBotUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;
    return BOT_USER_AGENT_PATTERN.test(userAgent);
  }

  static buildFrontendPostUrl(slug: string): string {
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const pathTemplate = process.env.SEO_POST_PATH_TEMPLATE || "/posts/{slug}";

    const postPath = pathTemplate.replace("{slug}", encodeURIComponent(slug));
    return new URL(postPath, frontendBaseUrl).toString();
  }

  static buildCanonicalPostUrl(slug: string): string {
    return this.normalizeAbsoluteUrl(this.buildFrontendPostUrl(slug));
  }

  static getSsgOutputDirectory(): string {
    return process.env.SSG_OUTPUT_DIR || "static-prerender";
  }

  private static escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private static stripHtml(rawText: string): string {
    return rawText
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static truncate(rawText: string, maxLength: number): string {
    if (rawText.length <= maxLength) return rawText;
    return `${rawText.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  private static getDescription(post: RenderablePost): string {
    const source = post.excerpt || post.content || "";
    const plainText = this.stripHtml(source);
    return this.truncate(plainText, 160);
  }

  private static getTitle(post: RenderablePost): string {
    const rawTitle = (post.title || "Blog Post").trim();
    return this.truncate(rawTitle, 70);
  }

  private static buildPostMeta(post: RenderablePost) {
    const title = this.getTitle(post);
    const description = this.getDescription(post);
    const canonicalUrl = this.buildCanonicalPostUrl(post.slug);
    const siteName = this.getSiteName();
    const categoryName = post.category?.name || "Blog";
    const authorName =
      post.author?.fullName ||
      post.author?.username ||
      post.authorId?.fullName ||
      post.authorId?.username ||
      "Unknown";

    const fallbackImage = process.env.SEO_DEFAULT_OG_IMAGE || "";
    const imageUrl = post.coverImage || fallbackImage;
    const tagNames = (post.tags || [])
      .map((tag) => tag?.name || "")
      .filter((name) => name.trim().length > 0);

    const publishedDate = post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined;

    const modifiedDateSource =
      post.modifiedOn || post.publishedAt || post.createdOn || null;
    const modifiedDate = modifiedDateSource
      ? new Date(modifiedDateSource).toISOString()
      : undefined;

    return {
      title,
      description,
      canonicalUrl,
      siteName,
      categoryName,
      authorName,
      imageUrl,
      tagNames,
      publishedDate,
      modifiedDate,
    };
  }

  private static buildJsonLd(post: RenderablePost) {
    const meta = this.buildPostMeta(post);

    const blogPosting: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: meta.title,
      description: meta.description,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": meta.canonicalUrl,
      },
      url: meta.canonicalUrl,
      articleSection: meta.categoryName,
      inLanguage: "vi",
      author: {
        "@type": "Person",
        name: meta.authorName,
      },
      publisher: {
        "@type": "Organization",
        name: meta.siteName,
      },
    };

    if (meta.publishedDate) {
      blogPosting.datePublished = meta.publishedDate;
    }

    if (meta.modifiedDate) {
      blogPosting.dateModified = meta.modifiedDate;
    }

    if (meta.imageUrl) {
      blogPosting.image = meta.imageUrl;
    }

    if (meta.tagNames.length > 0) {
      blogPosting.keywords = meta.tagNames.join(", ");
    }

    const interactionStatistics = [
      {
        value: post.viewCount,
        interactionType: "https://schema.org/ViewAction",
      },
      {
        value: post.likesCount,
        interactionType: "https://schema.org/LikeAction",
      },
      {
        value: post.commentsCount,
        interactionType: "https://schema.org/CommentAction",
      },
      {
        value: post.sharesCount,
        interactionType: "https://schema.org/ShareAction",
      },
    ]
      .filter((item) => Number(item.value) > 0)
      .map((item) => ({
        "@type": "InteractionCounter",
        interactionType: item.interactionType,
        userInteractionCount: Number(item.value),
      }));

    if (interactionStatistics.length > 0) {
      blogPosting.interactionStatistic = interactionStatistics;
    }

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: new URL(
            "/",
            process.env.FRONTEND_URL || "http://localhost:3000",
          ).toString(),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Posts",
          item: new URL(
            "/posts",
            process.env.FRONTEND_URL || "http://localhost:3000",
          ).toString(),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: meta.title,
          item: meta.canonicalUrl,
        },
      ],
    };

    return [blogPosting, breadcrumb];
  }

  static renderPostDocument(post: RenderablePost): string {
    const meta = this.buildPostMeta(post);
    const escapedTitle = this.escapeHtml(meta.title);
    const escapedDescription = this.escapeHtml(meta.description);
    const escapedAuthor = this.escapeHtml(meta.authorName);
    const escapedCategory = this.escapeHtml(meta.categoryName);
    const escapedCanonical = this.escapeHtml(meta.canonicalUrl);
    const escapedImage = this.escapeHtml(meta.imageUrl);

    const jsonLdBlocks = this.buildJsonLd(post)
      .map(
        (item) =>
          `<script type="application/ld+json">${JSON.stringify(item)}</script>`,
      )
      .join("\n    ");

    const articleTagMeta = meta.tagNames
      .map(
        (tag) =>
          `<meta property="article:tag" content="${this.escapeHtml(tag)}" />`,
      )
      .join("\n    ");

    const keywords = meta.tagNames.join(", ");
    const escapedKeywords = this.escapeHtml(keywords);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    ${keywords ? `<meta name="keywords" content="${escapedKeywords}" />` : ""}
    <link rel="canonical" href="${escapedCanonical}" />
    <meta property="og:site_name" content="${this.escapeHtml(meta.siteName)}" />
    <meta property="og:locale" content="${this.escapeHtml(this.getLocale())}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${escapedCanonical}" />
    ${meta.imageUrl ? `<meta property="og:image" content="${escapedImage}" />` : ""}
    ${meta.imageUrl ? `<meta property="og:image:alt" content="${escapedTitle}" />` : ""}
    ${meta.publishedDate ? `<meta property="article:published_time" content="${this.escapeHtml(meta.publishedDate)}" />` : ""}
    ${meta.modifiedDate ? `<meta property="article:modified_time" content="${this.escapeHtml(meta.modifiedDate)}" />` : ""}
    <meta property="article:author" content="${escapedAuthor}" />
    <meta property="article:section" content="${escapedCategory}" />
    ${articleTagMeta}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${this.escapeHtml(meta.siteName)}" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    ${meta.imageUrl ? `<meta name="twitter:image" content="${escapedImage}" />` : ""}
    ${jsonLdBlocks}
  </head>
  <body>
    <main>
      <article>
        <header>
          <h1>${escapedTitle}</h1>
          <p>By ${escapedAuthor}</p>
          <p>Category: ${escapedCategory}</p>
        </header>
        <section>
          <p>${escapedDescription}</p>
        </section>
        <p>
          <a href="${escapedCanonical}">Read full article</a>
        </p>
      </article>
    </main>
  </body>
</html>`;
  }

  static renderPostNotFound(slug: string): string {
    const escapedSlug = this.escapeHtml(slug);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Post Not Found</title>
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <main>
      <h1>Post not found</h1>
      <p>No post found for slug: ${escapedSlug}</p>
    </main>
  </body>
</html>`;
  }

  static renderPostGone(slug: string): string {
    const escapedSlug = this.escapeHtml(slug);

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Post Removed</title>
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <main>
      <h1>Post was removed</h1>
      <p>This content is no longer available (410 Gone).</p>
      <p>Slug: ${escapedSlug}</p>
    </main>
  </body>
</html>`;
  }
}

export type { RenderablePost };
export default SeoRenderService;
