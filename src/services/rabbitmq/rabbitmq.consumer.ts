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

  async subscribe(
    queue: string,
    handler: (payload: any) => Promise<void>,
  ): Promise<void> {
    try {
      await this.channel.assertQueue(queue, { durable: true });

      await this.channel.consume(queue, async (message) => {
        if (!message) return;

        try {
          const payload = JSON.parse(message.content.toString());
          await handler(payload);
          this.channel.ack(message);
        } catch (error) {
          logger.error(`Handler error [${queue}]`, error);
          // nack với requeue=false để tránh retry loop vô tận
          this.channel.nack(message, false, false);
        }
      });

      logger.info(`Subscribed to queue: ${queue}`);
    } catch (error) {
      logger.error(`RabbitMQ subscribe error [${queue}]`, error);
    }
  }
}
