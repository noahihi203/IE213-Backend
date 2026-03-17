import { createClient, RedisClientType } from "redis";

class RedisService {
  private static instance: RedisService;
  public client: RedisClientType;
  public subscriber: RedisClientType;

  private constructor() {
    const redisUrl = process.env.REDIS_URL!;

    this.client = createClient({ url: redisUrl });
    this.subscriber = this.client.duplicate();

    this.client.on("connect", () => console.log("✅ Redis connected"));
    this.client.on("error", (err) => console.error("❌ Redis error:", err));

    this.subscriber.on("error", (err) =>
      console.error("❌ Redis subscriber error:", err),
    );
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.subscriber.connect();
  }

  // --- BASIC CACHE ---

  async set(key: string, value: any): Promise<void> {
    const val = typeof value === "string" ? value : JSON.stringify(value);
    await this.client.set(key, val);
  }

  async setWithTTL(
    key: string,
    value: any,
    ttlSeconds: number,
  ): Promise<void> {
    const val = typeof value === "string" ? value : JSON.stringify(value);
    await this.client.setEx(key, ttlSeconds, val);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async del(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      if (key.length === 0) return;
      await this.client.del(key);
    } else {
      await this.client.del(key);
    }
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  // --- PUB/SUB ---

  async publish(channel: string, message: any): Promise<void> {
    const msg = typeof message === "string" ? message : JSON.stringify(message);
    await this.client.publish(channel, msg);
  }

  async subscribe(
    channel: string,
    callback: (message: any) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel, (message) => {
      try {
        callback(JSON.parse(message));
      } catch {
        callback(message);
      }
    });
  }
}

export const redisService = RedisService.getInstance();