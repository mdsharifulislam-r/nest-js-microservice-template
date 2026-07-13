import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisClientType,
  ) { }

  // =========================
  // KEY BUILDER
  // =========================
  private buildKey(key: string, query?: Record<string, any>) {
    if (!query) return `${key}:1`;

    const sorted = Object.keys(query)
      .sort()
      .reduce((acc, k) => {
        acc[k] = query[k];
        return acc;
      }, {} as Record<string, any>);

    return `${key}:${new URLSearchParams(sorted).toString()}`;
  }

  // =========================
  // GET
  // =========================
  async get<T>(key: string, query?: Record<string, any>) {
    const fullKey = this.buildKey(key, query);

    const data = await this.redis.get(fullKey);
    if (!data) return null;

    return JSON.parse(data) as T;
  }

  // =========================
  // SET
  // =========================
  async set(key: string, value: any, ttl = 60, query?: Record<string, any>) {
    const fullKey = this.buildKey(key, query);

    await this.redis.set(fullKey, JSON.stringify(value), {
      EX: ttl, // seconds
    });
  }

  // =========================
  // DELETE SINGLE
  // =========================
  async del(key: string, query?: Record<string, any>) {
    const fullKey = this.buildKey(key, query);
    await this.redis.del(fullKey);
  }

  // =========================
  // DELETE BY PATTERN (SAFE)
  // =========================
  async deleteByPattern(pattern: string) {
    const keys = await this.redis.keys(`${pattern}:*`);

    console.log('FOUND KEYS:', keys);

    if (!keys.length) return;

    await this.redis.del(keys); // FIXED
  }

  // =========================
  // RESET ALL CACHE
  // =========================
  async reset() {
    await this.redis.flushAll();
  }
}