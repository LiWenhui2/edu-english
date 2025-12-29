import { Module } from '@nestjs/common';
import { HashPasswordService } from './hash-password.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN') || '24h',
        },
      }),
    }),
  ],
  providers: [HashPasswordService],
  exports: [HashPasswordService],
})
export class SecurityModule {}
