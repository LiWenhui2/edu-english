import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'vonphy123', description: '用户名' })
  @IsString()
  readonly username: string;
  @ApiProperty({ example: '123456', description: '密码' })
  @IsString()
  readonly password: string;
}
