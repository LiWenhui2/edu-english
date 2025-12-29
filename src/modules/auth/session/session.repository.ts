import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserSessionDto } from '@/modules/auth/dto/user-session.dto';

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
  async createSession(dto: UserSessionDto) {
    return this.prisma.userSession.create({
      data: {
        userId: dto.userId,
        refreshTokenHash: dto.refreshTokenHash,
        refreshExpiresAt: dto.refreshExpiresAt,
        userAgent: dto.userAgent,
        ipAddress: dto.ipAddress,
      },
    });
  }
  async deleteById(id: number) {
    return this.prisma.userSession.delete({ where: { id } });
  }
  async deleteByHashToken(hash: string) {
    return this.prisma.userSession.delete({
      where: { refreshTokenHash: hash },
    });
  }
}
