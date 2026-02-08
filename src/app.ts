import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";

interface HttpError extends Error {
  status?: number;
  code?: string; // Add custom error code
}

const app = express();

// init middleware
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init db
import "./dbs/init.mongodb";

// init routes
import routes from "./routes/index.js";
app.use("/", routes);

// handling errors
app.use((req: Request, res: Response, next: NextFunction) => {
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
