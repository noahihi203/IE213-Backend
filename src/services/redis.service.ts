// src/services/redis.service.ts
import { createClient, RedisClientType } from "redis";

class RedisService {
  private static instance: RedisService;
  public client: RedisClientType;
  public subscriber: RedisClientType;

  private constructor() {
    // Cấu hình kết nối Redis
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

    this.client = createClient({ url: redisUrl });

    // Trong node-redis, client dùng để Subscribe không thể dùng để GET/SET
    // Ta dùng duplicate() để tạo một bản sao kết nối cho việc Subscribe
    this.subscriber = this.client.duplicate();

    this.client.on("connect", () => console.log("Redis Client connected"));
    this.client.on("error", (err) => console.error("Redis Client Error", err));

    this.subscriber.on("error", (err) =>
      console.error("Redis Subscriber Error", err),
    );
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  // BẮT BUỘC: Phải gọi hàm này lúc khởi động app (trong index.ts / server.ts)
  async connect(): Promise<void> {
    await this.client.connect();
    await this.subscriber.connect();
  }

  // --- HELPER METHODS ---

  async set(key: string, value: any): Promise<void> {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    await this.client.set(key, stringValue);
  }

  async setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void> {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    // Lưu ý: Trong node-redis v4, dùng setEx thay vì setex
    await this.client.setEx(key, ttlSeconds, stringValue);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      return data as unknown as T;
    }
  }

  async del(key: string | string[]): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  // --- PUB/SUB MULTI-INSTANCE ---

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel, (message) => {
      callback(message);
    });
  }
}

export const redisService = RedisService.getInstance();
