import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { MfaService } from '../mfa/mfa.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ValidateMfaDto } from './dtos/validate-mfa.dto';
import { VerifyMfaEnrollDto } from './dtos/enroll-mfa.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.authService.validateCredentials(dto.email, dto.password);
    if (!user) {
      const { UnauthorizedException } = await import('@nestjs/common');
      throw new UnauthorizedException('Invalid credentials');
    }
    const ip = (req.ip ?? req.socket.remoteAddress) as string;
    return this.authService.login(user.id, ip, req.headers['user-agent']);
  }

  @Post('auth/mfa/enroll')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll TOTP MFA — returns QR code' })
  async enrollMfa(@CurrentUser() user: AuthUser) {
    return this.mfaService.enrollTotp(user.id, user.email);
  }

  @Post('auth/mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify TOTP enrollment code — activates MFA' })
  async verifyMfaEnroll(@CurrentUser() user: AuthUser, @Body() dto: VerifyMfaEnrollDto) {
    await this.mfaService.verifyAndActivate(user.id, dto.factorId, dto.code);
    return { message: 'MFA activated successfully' };
  }

  @Public()
  @Post('auth/mfa/validate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Validate MFA code during login flow' })
  async validateMfa(@Body() dto: ValidateMfaDto, @Req() req: Request) {
    const ip = (req.ip ?? req.socket.remoteAddress) as string;
    return this.authService.validateMfa(dto.mfaToken, dto.code, ip, req.headers['user-agent']);
  }

  @Public()
  @Post('auth/token/refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ip = (req.ip ?? req.socket.remoteAddress) as string;
    return this.authService.refreshToken(dto.refreshToken, ip);
  }

  @Post('auth/token/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke current session' })
  async revoke(@CurrentUser() user: AuthUser, @Body() dto: RefreshTokenDto) {
    await this.authService.revokeSession(user.id, dto.refreshToken);
  }

  @Post('auth/token/revoke-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions' })
  async revokeAll(@CurrentUser() user: AuthUser) {
    await this.authService.revokeAllSessions(user.id);
  }

  @Get('auth/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user profile' })
  async me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Public()
  @Get('api/.well-known/jwks.json')
  @ApiOperation({ summary: 'JWKS public key set' })
  async jwks() {
    return this.authService.getJwks();
  }
}
