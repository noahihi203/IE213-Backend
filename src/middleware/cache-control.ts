import { NextFunction, Request, Response } from "express";

export const withPublicCache = (
  maxAgeSeconds: number,
  staleWhileRevalidateSeconds: number = 0,
) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const directives = [
      "public",
      `max-age=${maxAgeSeconds}`,
      `s-maxage=${maxAgeSeconds}`,
    ];

    if (staleWhileRevalidateSeconds > 0) {
      directives.push(`stale-while-revalidate=${staleWhileRevalidateSeconds}`);
    }

    res.setHeader("Cache-Control", directives.join(", "));
    next();
  };
};
