import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: number) {
    return this.prisma.userSession.findUnique({ where: { id } });
  }
  async findByTokenHash(hash: string) {
    return this.prisma.userSession.findUnique({
      where: { refreshTokenHash: hash },
    });
  }
  async rotateToken(sessionId: number, newHash: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { refreshTokenHash: newHash, rotatedAt: new Date() },
    });
  }
}
