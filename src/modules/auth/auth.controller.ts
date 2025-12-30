import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Message } from '@/common/decorators/message.decorator';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '@/modules/auth/decorators/public.decorator';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
  })
  @ApiResponse({
    status: 401,
    description: '用户名或密码错误',
  })
  @HttpCode(200)
  @Message('登录成功')
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({
    status: 200,
    description: '注册成功',
  })
  @ApiResponse({
    status: 400,
    description: '参数错误',
  })
  @ApiResponse({
    status: 409,
    description: '用户名冲突',
  })
  @HttpCode(200)
  @Message('注册成功')
  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  @ApiOperation({ summary: '刷新access token' })
  @ApiResponse({
    status: 200,
    description: '请求成功',
  })
  @ApiResponse({
    status: 400,
    description: '参数错误',
  })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }
  // @Post('logout')
  // @Post('send-sms')
  // sendSmsCode() {
  //   return this.authService.sendSmsCode();
  // }
}
