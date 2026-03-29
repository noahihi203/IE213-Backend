import app from "./src/app.js";
import logger from "./src/config/logger.config.js";
import { startViewSyncWorker } from "./src/services/view-sync.service.js";
import { redisService } from "./src/services/redis.service.js";
import fs from "fs";
import http from "http";
import https from "https";
import http2 from "http2";

import { rabbitMQProducer } from "./src/services/rabbitmq/rabbitmq.producer.js";
import { NotificationConsumer } from "./src/services/rabbitmq/NotificationConsumer.js"; // đổi import
import { shouldEnforceHttps } from "./src/middleware/https-enforcement.js";

const PORT = Number(process.env.PORT || 5001);
const HTTPS_PORT = Number(process.env.HTTPS_PORT || PORT);
const HTTP_PORT = Number(process.env.HTTP_PORT || 5001);

function hasTlsConfiguration() {
  return Boolean(process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH);
}

function shouldUseHttp2() {
  const forceHttp2 = process.env.ENABLE_HTTP2;
  if (forceHttp2) {
    return forceHttp2.toLowerCase() === "true";
  }

  return process.env.NODE_ENV === "production";
}

function createHttpsServer() {
  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;

  if (!certPath || !keyPath) {
    return null;
  }

  const cert = fs.readFileSync(certPath);
  const key = fs.readFileSync(keyPath);

  if (shouldUseHttp2()) {
    return http2.createSecureServer(
      {
        key,
        cert,
        allowHTTP1: true,
      },
      app,
    );
  }

  return https.createServer({ key, cert }, app);
}

function createHttpRedirectServer() {
  return http.createServer((req, res) => {
    const hostHeader = req.headers.host || "localhost";
    const hostWithoutPort = hostHeader.split(":")[0];
    const pathname = req.url || "/";
    const httpsPortSegment = HTTPS_PORT === 443 ? "" : `:${HTTPS_PORT}`;
    const target = `https://${hostWithoutPort}${httpsPortSegment}${pathname}`;

    res.statusCode = 301;
    res.setHeader("Location", target);
    res.end();
  });
}

async function bootstrap() {
  try {
    // RabbitMQ Producer
    await rabbitMQProducer.connect();

    // Redis
    await redisService.connect();
    logger.info("Redis connected");

    // RabbitMQ Consumer
    const notificationConsumer = new NotificationConsumer();
    await notificationConsumer.start();

    logger.info("System ready 🚀");
  } catch (error) {
    logger.error("Startup failed:", error);
    process.exit(1);
  }
}

bootstrap();

const tlsServer = hasTlsConfiguration() ? createHttpsServer() : null;
const enforceHttps = shouldEnforceHttps();

if (tlsServer) {
  tlsServer.listen(HTTPS_PORT, () => {
    const protocol = shouldUseHttp2() ? "HTTPS + HTTP/2" : "HTTPS";
    logger.info(`WSV eCommerce start with ${protocol} on port ${HTTPS_PORT}`);
  });

  if (enforceHttps) {
    const redirectServer = createHttpRedirectServer();
    redirectServer.listen(HTTP_PORT, () => {
      logger.info(`HTTP redirect server started on port ${HTTP_PORT}`);
    });
  }
} else {
  app.listen(PORT, () => {
    logger.warn(
      "TLS certificate is not configured. Running HTTP only. Set SSL_CERT_PATH and SSL_KEY_PATH for HTTPS/HTTP2.",
    );
    logger.info(`WSV eCommerce start with HTTP on port ${PORT}`);
  });
}
