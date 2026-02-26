import { Kafka, Producer, Partitioners } from "kafkajs";
import logger from "../../config/logger.config.js";

export class KafkaProducer {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: "notification-service",
      brokers: ["localhost:9092"], // Cấu hình broker của bạn
      retry: {
        initialRetryTime: 100,
        retries: 5,
      },
    });

    this.producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
  }

  async connect() {
    await this.producer.connect();
    logger.info("Kafka Producer connected");
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  async publishNotificationEvent(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
        // Đảm bảo message được ghi xuống ít nhất 1 broker
        acks: 1,
      });
    } catch (error) {
      logger.error(`Kafka Publish Error [${topic}]:`, error);
    }
  }
}

export const kafkaProducer = new KafkaProducer();
