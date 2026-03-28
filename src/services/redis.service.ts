import { createClient, RedisClientType } from "redis";

class RedisService {
  private static instance: RedisService;
  public client: RedisClientType;
  public subscriber: RedisClientType;

  private static buildRedisConnectionUrl(): string {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) return redisUrl;

    const host = process.env.REDIS_HOST || "localhost";
    const port = process.env.REDIS_PORT || "6379";
    const username = process.env.REDIS_USERNAME;
    const password = process.env.REDIS_PASSWORD;

    let credentials = "";
    if (password && username) {
      credentials = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
    } else if (password) {
      credentials = `:${encodeURIComponent(password)}@`;
    } else if (username) {
      credentials = `${encodeURIComponent(username)}@`;
    }

    return `redis://${credentials}${host}:${port}`;
  }

  private constructor() {
    const redisUrl = RedisService.buildRedisConnectionUrl();

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
    try {
      await this.client.connect();
    } catch (error) {
      console.error(
        "⚠️ Redis client connection failed. Cache will be skipped:",
        error,
      );
    }

    try {
      await this.subscriber.connect();
    } catch (error) {
      console.error("⚠️ Redis subscriber connection failed:", error);
    }
  }

  // --- BASIC CACHE ---

  async set(key: string, value: any): Promise<void> {
    if (!this.client?.isReady) return;
    try {
      const val = typeof value === "string" ? value : JSON.stringify(value);
      await this.client.set(key, val);
    } catch (error) {
      console.error("❌ Redis set error:", error);
    }
  }

  async setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.client?.isReady) return;
    try {
      const val = typeof value === "string" ? value : JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, val);
    } catch (error) {
      console.error("❌ Redis setWithTTL error:", error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client?.isReady) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (error) {
      console.error("❌ Redis get error:", error);
      return null;
    }
  }

  async del(key: string | string[]): Promise<void> {
    if (!this.client?.isReady) return;
    try {
      if (Array.isArray(key)) {
        if (key.length === 0) return;
        await this.client.del(key);
      } else {
        await this.client.del(key);
      }
    } catch (error) {
      console.error("❌ Redis del error:", error);
    }
  }

  async delByPrefix(prefix: string, batchSize: number = 200): Promise<number> {
    if (!this.client?.isReady) return 0;

    let deletedCount = 0;
    let pendingKeys: string[] = [];

    try {
      const iterator = this.client.scanIterator({
        MATCH: `${prefix}*`,
        COUNT: batchSize,
      }) as AsyncIterable<string | string[]>;

      for await (const item of iterator) {
        const keys = Array.isArray(item) ? item : [item];

        for (const key of keys) {
          if (typeof key === "string" && key.length > 0) {
            pendingKeys.push(key);
          }
        }

        if (pendingKeys.length >= batchSize) {
          deletedCount += await this.client.del(pendingKeys);
          pendingKeys = [];
        }
      }

      if (pendingKeys.length > 0) {
        deletedCount += await this.client.del(pendingKeys);
      }
    } catch (error) {
      console.error("❌ Redis delByPrefix error:", error);
    }

    return deletedCount;
  }

  async incr(key: string): Promise<number> {
    if (!this.client?.isReady) return 0;
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error("❌ Redis incr error:", error);
      return 0;
    }
  }

  // --- PUB/SUB ---

  async publish(channel: string, message: any): Promise<void> {
    if (!this.client?.isReady) return;
    try {
      const msg =
        typeof message === "string" ? message : JSON.stringify(message);
      await this.client.publish(channel, msg);
    } catch (error) {
      console.error("❌ Redis publish error:", error);
    }
  }

  async subscribe(
    channel: string,
    callback: (message: any) => void,
  ): Promise<void> {
    if (!this.subscriber?.isReady) return;
    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          callback(JSON.parse(message));
        } catch {
          callback(message);
        }
      });
    } catch (error) {
      console.error("❌ Redis subscribe error:", error);
    }
  }
}

export const redisService = RedisService.getInstance();
