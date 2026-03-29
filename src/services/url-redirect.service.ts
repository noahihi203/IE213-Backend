import { urlRedirectModel } from "../models/urlRedirect.model.js";

class UrlRedirectService {
  static normalizePath(rawPath: string): string {
    if (!rawPath) return "/";

    const [pathname] = rawPath.split("?");
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

    if (path.length > 1) {
      return path.replace(/\/+$/, "");
    }

    return path;
  }

  static async upsertRedirect(
    fromPath: string,
    toUrl: string,
    statusCode: 301 | 302 = 301,
  ): Promise<void> {
    const normalizedFromPath = UrlRedirectService.normalizePath(fromPath);

    if (!normalizedFromPath || !toUrl) return;

    await urlRedirectModel.findOneAndUpdate(
      { fromPath: normalizedFromPath },
      {
        $set: {
          toUrl,
          statusCode,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  static async resolveRedirect(path: string): Promise<{
    statusCode: 301 | 302;
    toUrl: string;
  } | null> {
    const normalizedPath = UrlRedirectService.normalizePath(path);
    if (!normalizedPath) return null;

    const redirect = await urlRedirectModel
      .findOne({ fromPath: normalizedPath, isActive: true })
      .select("toUrl statusCode")
      .lean();

    if (!redirect) return null;

    return {
      statusCode: redirect.statusCode,
      toUrl: redirect.toUrl,
    };
  }
}

export default UrlRedirectService;
