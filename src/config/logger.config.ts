import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const env = process.env.NODE_ENV || "dev";
const isDev = env !== "prod";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "cyan",
};

winston.addColors(colors);

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
);

const consoleFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return stack
      ? `${timestamp} ${level}: ${message}\n${stack}${metaStr}`
      : `${timestamp} ${level}: ${message}${metaStr}`;
  }),
);

const fileFormat = winston.format.combine(baseFormat, winston.format.json());

// --- Transports ---

const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// logs/error-%DATE%.log — Chỉ errors
const errorFileTransport = new DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxSize: "20m",
  maxFiles: "14d",
  zippedArchive: true,
  format: fileFormat,
});

// logs/combined-%DATE%.log — Tất cả logs
const combinedFileTransport = new DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  zippedArchive: true,
  format: fileFormat,
});

// --- Create Logger ---

const logTransports: winston.transport[] = [
  errorFileTransport,
  combinedFileTransport,
];

// Dev: thêm console transport (colorized)
if (isDev) {
  logTransports.push(consoleTransport);
}

const logger = winston.createLogger({
  levels,
  level: isDev ? "debug" : "http",
  transports: logTransports,
});

export default logger;
