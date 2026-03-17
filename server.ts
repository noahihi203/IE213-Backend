import app from "./src/app";
import logger from "./src/config/logger.config.js";
// const { initRedis } = require("./src/services/redis.service");
import { startViewSyncWorker } from "./src/services/view-sync.service.js";

const PORT = process.env.PORT || 5000;
// server.ts
import { KafkaConsumer } from "./src/services/kafka/kafka.cosumer.js";
import { kafkaProducer } from "./src/services/kafka/kafka.producer.js";
import { redisService } from "./src/services/redis.service.js";

// await redisService.subscribe("CACHE_INVALIDATION", (keyToInvalidate) => {
//   console.log(
//     `Server nhận yêu cầu xóa cache cục bộ cho key: ${keyToInvalidate}`,
//   );
//   // Xóa local cache tại đây (nếu dùng)
// });

async function bootstrap() {
  try {
    // 1. Kết nối Producer trước (để API có thể gửi tin)
    await kafkaProducer.connect();
    await redisService.connect();
    startViewSyncWorker();
    // 2. Kết nối Consumer để bắt đầu xử lý job ngầm
    const consumer = new KafkaConsumer();
    await consumer.connect();
    
    logger.info("Notification System is ready with Kafka");

    // 3. Khởi động Express Server (hoặc framework bạn dùng)
    // app.listen(3000, () => ...)
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
const server = app.listen(PORT, async () => {
  // await initRedis();
  logger.info(`WSV eCommerce start with port ${PORT}`);
});

// process.on("SIGINT", () => {
//   server.close(() => console.log(`Exit Server Express`));
// });
