import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'b67fc3ae1757363c3754323860606abc8d37e8aa3e563597d45b76900d1ac8b1',
    description: '刷新用的 refresh token',
  })
  @IsString()
  @IsNotEmpty({ message: 'refreshToken不能为空' })
  readonly refreshToken: string;
}
