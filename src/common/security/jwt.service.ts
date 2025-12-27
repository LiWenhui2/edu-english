import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AccessTokenPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwt: NestJwtService,
    private configService: ConfigService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwt.verify(token, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
    });
  }
}
