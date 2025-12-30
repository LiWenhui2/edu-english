import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../user/user.repository';
import { SessionRepository } from './session/session.repository';
import { RefreshTokenService } from './token/refresh-token.service';
import { HashPasswordService } from '@/common/security/hash-password.service';
import { AccessTokenService } from '@/modules/auth/token/access-token.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { generateRandomToken } from '@/common/utils/random.util';
import { sha256 } from '@/common/utils/hash.util';
import { RegisterDto } from '@/modules/auth/dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly jwtService: AccessTokenService,
    private readonly sessionRepo: SessionRepository,
    private readonly hashPasswordService: HashPasswordService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}
  // 用户登录
  async login(loginDto: LoginDto, req: Request) {
    const user = await this.userRepo.findUsersByUsername(loginDto.username);
    const isPasswordValid = await this.hashPasswordService.validatePassword(
      loginDto.password,
      user?.password || '',
    );
    if (!user || !isPasswordValid) {
      this.logger.warn(
        {
          username: loginDto.username,
          action: 'login',
          result: 'fail',
          reason: 'user_not_found',
        },
        'Authentication failed',
      );
      throw new UnauthorizedException('用户名或密码错误');
    }
    const accessToken = this.jwtService.signAccessToken({
      sub: user.id.toString(),
    });
    const refreshToken = generateRandomToken();
    const refreshTokenHash = sha256(refreshToken);
    const refreshTokenExpiresIn = this.configService.get<number>(
      'JWT_ACCESS_EXPIRES_IN',
    )!;
    const refreshExpiresAt = new Date(
      Date.now() + refreshTokenExpiresIn * 1000,
    );
    await this.sessionRepo.createSession({
      userId: user.id,
      refreshTokenHash,
      refreshExpiresAt,
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
      ipAddress: (req.headers['x-forwarded-for'] as string) || 'unknown',
    });
    this.logger.log(
      {
        userId: user.id,
        username: loginDto.username,
        action: 'login',
        result: 'success',
      },
      'User authenticated successfully',
    );
    return { accessToken: 'bearer ' + accessToken, refreshToken: refreshToken };
  }
  //用户注册
  async register(registerDto: RegisterDto) {
    let password = registerDto.password;
    const user = await this.userRepo.findUsersByUsername(registerDto.username);
    if (user) {
      this.logger.warn(
        {
          username: registerDto.username,
          action: 'register',
          result: 'fail',
          reason: 'user_conflict',
        },
        'Register failed',
      );
      throw new ConflictException('用户名已存在');
    }
    password = await this.hashPasswordService.hashPassword(password);
    await this.userRepo.createUser(registerDto.username, password);
    return;
  }
  //刷新Token
  async refresh(rawToken: string) {
    const { userId, newRefreshToken } =
      await this.refreshTokenService.rotate(rawToken);
    const accessToken = this.jwtService.signAccessToken({
      sub: userId!.toString(),
    });
    return {
      accessToken: 'Bearer ' + accessToken,
      refreshToken: newRefreshToken,
    };
  }
  // 用户登出
  // async logout(rawToken: string) {
}
