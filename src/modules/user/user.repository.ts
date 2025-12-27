import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}
  //创建用户
  async createUser(username: string, password: string) {
    return this.prisma.users.create({
      data: { username, password },
      select: { id: true, username: true, create_at: true },
    });
  }
  //查询用户
  async findUsersByUsername(username: string) {
    return this.prisma.users.findUnique({ where: { username } });
  }
}
