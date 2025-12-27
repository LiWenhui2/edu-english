import { HashPasswordService } from './security/hash-password.service';
import { Module } from '@nestjs/common';
import { JwtService } from './security/jwt.service';

@Module({
  providers: [HashPasswordService, JwtService],
  exports: [HashPasswordService, JwtService],
})
export class CommonModule {}
