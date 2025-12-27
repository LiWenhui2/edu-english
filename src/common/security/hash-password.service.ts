import { Injectable } from '@nestjs/common';

@Injectable()
export class HashPasswordService {
  private readonly SALT_ROUNDS = 10;

  async hashPassword(data: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(data, this.SALT_ROUNDS);
  }
  async validatePassword(
    plainData: string,
    hashedData: string,
  ): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return await bcrypt.compare(plainData, hashedData);
  }
}
