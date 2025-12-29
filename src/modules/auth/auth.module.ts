import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { SessionRepository } from './session/session.repository';
import { RefreshTokenService } from './token/refresh-token.service';
import { SecurityModule } from '@/common/security/security.module';
import { AccessTokenService } from '@/modules/auth/token/access-token.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    RedisModule,
    SecurityModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionRepository,
    RefreshTokenService,
    AccessTokenService,
  ],
  exports: [AuthService, AccessTokenService],
})
export class AuthModule {}
