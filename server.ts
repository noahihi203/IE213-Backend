import app from "./src/app.js";
import logger from "./src/config/logger.config.js";
import { startViewSyncWorker } from "./src/services/view-sync.service.js";
import { redisService } from "./src/services/redis.service.js";

import { rabbitMQProducer } from "./src/services/rabbitmq/rabbitmq.producer.js";
import { NotificationConsumer } from "./src/services/rabbitmq/NotificationConsumer.js"; // đổi import

const PORT = 5001;

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

const server = app.listen(PORT, async () => {
  logger.info(`WSV eCommerce start with port ${PORT}`);
});
