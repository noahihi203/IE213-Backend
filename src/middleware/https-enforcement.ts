import { NextFunction, Request, Response } from "express";

function toBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
}

export function shouldEnforceHttps(): boolean {
  const byEnv = process.env.HTTPS_REDIRECT_ENABLED;
  const isProduction = process.env.NODE_ENV === "production";
  return toBoolean(byEnv, isProduction);
}

function isLocalDevelopmentHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export const enforceHttps = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!shouldEnforceHttps()) return next();

  const host = req.headers.host || "";
  const allowInsecureLocal = toBoolean(
    process.env.ALLOW_INSECURE_LOCALHOST,
    true,
  );

  if (allowInsecureLocal && isLocalDevelopmentHost(host)) {
    return next();
  }

  if (req.secure) {
    return next();
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string" && forwardedProto.includes("https")) {
    return next();
  }

  const targetHost = host || process.env.PUBLIC_HOST || "localhost";
  const requestPath = req.originalUrl || req.url || "/";
  const targetUrl = `https://${targetHost}${requestPath}`;
  return res.redirect(301, targetUrl);
};
