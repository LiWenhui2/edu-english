import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    private readonly logger: Logger,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }
  async set(key: string, value: string, ttlSeconds: number) {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }
  async del(key: string) {
    await this.redis.del(key);
  }
}
