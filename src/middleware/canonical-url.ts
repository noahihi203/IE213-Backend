import { NextFunction, Request, Response } from "express";

export const enforceCanonicalTrailingSlash = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  const originalUrl = req.originalUrl || req.url || "";
  const [pathname, queryString] = originalUrl.split("?");

  if (pathname.length > 1 && pathname.endsWith("/")) {
    const canonicalPath = pathname.replace(/\/+$/, "");
    const location = queryString
      ? `${canonicalPath}?${queryString}`
      : canonicalPath;

    return res.redirect(301, location);
  }

  return next();
};
