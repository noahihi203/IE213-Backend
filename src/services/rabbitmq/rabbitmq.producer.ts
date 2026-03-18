import amqp, { Channel, ChannelModel } from "amqplib";
import logger from "../../config/logger.config.js";

class RabbitMQProducer {
  private connection!: ChannelModel;
  private channel!: Channel;

  async connect() {
    try {
      this.connection = await amqp.connect({
        protocol: "amqp",
        hostname: process.env.RABBITMQ_HOST,
        port: Number(process.env.RABBITMQ_PORT),
        username: process.env.RABBITMQ_USER,
        password: process.env.RABBITMQ_PASS,
      });

      this.channel = await this.connection.createChannel();
      logger.info("🐰 RabbitMQ Producer connected");
    } catch (error) {
      logger.error("RabbitMQ Producer connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  async send(queue: string, message: any) {
    try {
      await this.channel.assertQueue(queue, { durable: true });
      
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
    } catch (error) {
      logger.error(`RabbitMQ send error [${queue}]`, error);
    }
  }
}

export const rabbitMQProducer = new RabbitMQProducer();