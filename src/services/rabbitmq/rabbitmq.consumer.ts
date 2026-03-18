import amqp, { Channel, ChannelModel } from "amqplib";
import logger from "../../config/logger.config.js";

export class RabbitMQConsumer {
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
      logger.info("✅ RabbitMQ Consumer connected");
    } catch (error) {
      logger.error("RabbitMQ Consumer connection error:", error);
      throw error;
    }
  }

  async subscribe(queue: string) {
    try {
      await this.channel.assertQueue(queue, { durable: true });

      await this.channel.consume(queue, (message) => {
        if (message) {
          const value = message.content.toString();
          console.log(`📩 RabbitMQ received from [${queue}]:`, value);
          
          this.channel.ack(message); 
        }
      });
    } catch (error) {
      logger.error(`RabbitMQ subscribe error [${queue}]`, error);
    }
  }
}