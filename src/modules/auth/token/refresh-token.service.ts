import { Injectable, UnauthorizedException } from '@nestjs/common';
import { sha256 } from '@/common/utils/hash.util';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { UserSessionDto } from '../dto/user-session.dto';
import { SessionRepository } from '../session/session.repository';
import { generateRandomToken } from '@/common/utils/random.util';

@Injectable()
export class RefreshTokenService {
  constructor(
    private redis: RedisService,
    private sessionRepo: SessionRepository,
  ) {}
  async rotate(rawToken: string) {
    const tokenHash = sha256(rawToken);
    const usedKey = `auth:refresh:used:${tokenHash}`;
    // 重放检测
    if (await this.redis.get(usedKey)) {
      //删除数据库该session记录
      const id = await this.redis.get(`auth:refresh:${tokenHash}`);
      if (id) {
        await this.sessionRepo.deleteById(Number(id));
      } else {
        await this.sessionRepo.deleteByHashToken(tokenHash);
      }
      throw new UnauthorizedException('refresh token reuse detected');
    }
    const sessionId = await this.redis.get(`auth:refresh:${tokenHash}`);
    let session: UserSessionDto | null;
    if (sessionId) {
      session = await this.sessionRepo.findById(Number(sessionId));
    } else {
      session = await this.sessionRepo.findByTokenHash(tokenHash);
    }
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.refreshExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const remainingTtl = Math.max(
      Math.floor((session.refreshExpiresAt.getTime() - Date.now()) / 1000),
      1,
    );
    await this.redis.set(usedKey, '1', remainingTtl);
    const newRefreshToken = generateRandomToken();
    const newHash = sha256(newRefreshToken);
    console.log('Rotating refresh token for session:', session.id);
    await this.sessionRepo.rotateToken(Number(session.id), newHash);
    //写入Redis
    await this.redis.set(
      `auth:refresh:${newHash}`,
      String(sessionId),
      remainingTtl,
    );
    return { userId: session.id, newRefreshToken };
  }
}
