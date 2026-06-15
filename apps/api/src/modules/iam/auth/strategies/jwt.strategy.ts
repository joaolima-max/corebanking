import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../database/prisma.service';
import type { AuthUser } from '../../../../common/decorators/current-user.decorator';
import type { AppConfig } from '../../../../config/configuration';

interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  roles: string[];
  permissions: string[];
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService<AppConfig>,
  ) {
    const publicKey = configService.get<AppConfig['jwt']>('jwt')?.publicKey;
    if (!publicKey && process.env['NODE_ENV'] === 'production') {
      throw new Error('JWT_PUBLIC_KEY must be set in production');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey || 'dev-fallback-not-for-production',
      algorithms: publicKey ? ['RS256'] : ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, fullName: true, orgId: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      orgId: user.orgId,
      status: user.status,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
