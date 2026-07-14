import "dotenv/config";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const isUpstashEnabled = () =>
  Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

let redisInstance: Redis | undefined;
let ratelimitInstance: Ratelimit | undefined;

function getRedisInstance() {
  if (!isUpstashEnabled()) return;
  redisInstance ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return redisInstance;
}

function getRatelimitInstance() {
  const redis = getRedisInstance();
  if (!redis) return;
  ratelimitInstance ??= new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1m"),
    analytics: true,
  });
  return ratelimitInstance;
}

const getTruePath = (path: string) => path.split("?")[0];

export const cache = async (path: string, body: unknown, seconds = 300) => {
  const redis = getRedisInstance();
  if (!redis) return;
  await redis.set(`cache:${getTruePath(path)}`, JSON.stringify(body), {
    ex: seconds,
  });
};

export const getCachedResult = async (path: string) => {
  const redis = getRedisInstance();
  if (!redis) return null;
  return (await redis.get(`cache:${getTruePath(path)}`)) as
    | string
    | Object
    | Array<unknown>
    | null;
};

export const limitRequest = async (identifier: string) => {
  const ratelimit = getRatelimitInstance();
  if (!ratelimit) return { success: true, reset: 0 };
  return ratelimit.limit(identifier);
};
