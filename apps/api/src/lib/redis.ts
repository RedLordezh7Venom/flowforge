
import Redis from "ioredis";
const redisUrl = process.env["REDIS_URL"] || "redis://localhost:6379";
export const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, retryStrategy: (times) => Math.min(times * 100, 3000) });
redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("Redis connected"));
