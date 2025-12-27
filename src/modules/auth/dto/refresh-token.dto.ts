import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'rihriosjeruijers',
    description: '刷新用的 refresh token',
  })
  @IsString()
  @IsNotEmpty({ message: 'refreshToken不能为空' })
  readonly refreshToken: string;
}
