import app from "./src/app";
// const { initRedis } = require("./src/services/redis.service");

const PORT = process.env.PORT || 5000;
// server.ts
import { KafkaConsumer } from "./src/services/kafka/kafka.cosumer.js";
import { kafkaProducer } from "./src/services/kafka/kafka.producer.js";

async function bootstrap() {
  try {
    // 1. Kết nối Producer trước (để API có thể gửi tin)
    await kafkaProducer.connect();

    // 2. Kết nối Consumer để bắt đầu xử lý job ngầm
    const consumer = new KafkaConsumer();
    await consumer.connect();

    console.log(" Notification System is ready with Kafka");

    // 3. Khởi động Express Server (hoặc framework bạn dùng)
    // app.listen(3000, () => ...)
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    process.exit(1); // Thoát nếu không kết nối được hạ tầng quan trọng
  }
}

bootstrap();
const server = app.listen(PORT, async () => {
  // await initRedis();
  console.log(`WSV eCommerce start with port ${PORT}`);
});

// process.on("SIGINT", () => {
//   server.close(() => console.log(`Exit Server Express`));
// });
