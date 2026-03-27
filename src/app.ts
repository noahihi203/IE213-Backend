import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { constants } from "zlib";
import path from "path";

interface HttpError extends Error {
  status?: number;
  code?: string; // Add custom error code
}

const app = express();

const shouldCompress: compression.CompressionFilter = (req, res) => {
  if (req.headers["x-no-compression"]) {
    return false;
  }

  return compression.filter(req, res);
};

app.set("etag", "strong");

// init middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-client-id"],
  }),
);
app.use(morgan("dev"));
app.use(helmet());
app.use(
  compression({
    threshold: 1024,
    filter: shouldCompress,
    level: 6,
    brotli: {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 5,
      },
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/ssg",
  express.static(path.resolve(process.cwd(), "static-prerender"), {
    maxAge: "1h",
  }),
);

// init db
import "./dbs/init.mongodb";

// init routes
import routes from "./routes/index.js";
app.use("/", routes);

// handling errors
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error: HttpError = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use(
  (error: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Internal Server error",
      ...(error.code && { code: error.code }), // Include custom error code if present
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  },
);

export default app;
