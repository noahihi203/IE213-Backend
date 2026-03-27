type AuthorLike = {
  fullName?: string;
  username?: string;
};

type CategoryLike = {
  name?: string;
};

type RenderablePost = {
  slug: string;
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  publishedAt?: string | Date | null;
  author?: AuthorLike;
  authorId?: AuthorLike;
  category?: CategoryLike;
};

const BOT_USER_AGENT_PATTERN =
  /googlebot|bingbot|yandexbot|duckduckbot|baiduspider|slurp|facebookexternalhit|twitterbot|linkedinbot|rogerbot|embedly|quora link preview|slackbot|whatsapp|telegrambot|discordbot|applebot/i;

class SeoRenderService {
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

  static renderPostDocument(post: RenderablePost): string {
    const title = post.title || "Blog Post";
    const description = this.getDescription(post);
    const canonicalUrl = this.buildFrontendPostUrl(post.slug);
    const imageUrl = post.coverImage || "";
    const authorName =
      post.author?.fullName ||
      post.author?.username ||
      post.authorId?.fullName ||
      post.authorId?.username ||
      "Unknown";
    const categoryName = post.category?.name || "Blog";
    const publishedDate = post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined;

    const escapedTitle = this.escapeHtml(title);
    const escapedDescription = this.escapeHtml(description);
    const escapedAuthor = this.escapeHtml(authorName);
    const escapedCategory = this.escapeHtml(categoryName);
    const escapedCanonical = this.escapeHtml(canonicalUrl);
    const escapedImage = this.escapeHtml(imageUrl);

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description,
      author: {
        "@type": "Person",
        name: authorName,
      },
      mainEntityOfPage: canonicalUrl,
      articleSection: categoryName,
    };

    if (publishedDate) {
      jsonLd.datePublished = publishedDate;
    }

    if (imageUrl) {
      jsonLd.image = imageUrl;
    }

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    <link rel="canonical" href="${escapedCanonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${escapedCanonical}" />
    ${imageUrl ? `<meta property="og:image" content="${escapedImage}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    ${imageUrl ? `<meta name="twitter:image" content="${escapedImage}" />` : ""}
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
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
}

export type { RenderablePost };
export default SeoRenderService;
