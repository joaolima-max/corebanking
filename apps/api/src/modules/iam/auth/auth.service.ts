import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { MfaService } from '../mfa/mfa.service';
import type { AppConfig } from '../../../config/configuration';
import type { RegisterDto } from './dtos/register.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult {
  requiresMfa: boolean;
  mfaToken?: string;
  tokens?: TokenPair;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async register(dto: RegisterDto): Promise<{ userId: string; email: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    let orgId: string;

    if (dto.orgMode === 'existing' && dto.existingOrgId) {
      const org = await this.prisma.organization.findUnique({ where: { id: dto.existingOrgId } });
      if (!org) throw new BadRequestException('Invalid registration request');
      orgId = org.id;
    } else {
      const orgName = dto.orgName ?? `${dto.fullName}'s Organization`;
      const slug = this.slugify(orgName) + '-' + randomUUID().slice(0, 8);
      const org = await this.prisma.organization.create({
        data: { name: orgName, slug, type: 'COMPANY', status: 'ACTIVE' },
      });
      orgId = org.id;
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        orgId,
        status: 'ACTIVE',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId,
        action: 'CREATE',
        resourceType: 'User',
        resourceId: user.id,
        newValue: { email: user.email, fullName: user.fullName },
      },
    });

    return { userId: user.id, email: user.email };
  }

  async validateCredentials(email: string, password: string): Promise<{ id: string; email: string } | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status === 'INACTIVE' || user.status === 'BLOCKED') {
      return null;
    }

    const valid = await argon2.verify(user.passwordHash, password);
    return valid ? { id: user.id, email: user.email } : null;
  }

  async login(userId: string, ipAddress: string, userAgent?: string): Promise<LoginResult> {
    const hasMfa = await this.mfaService.hasMfa(userId);

    if (hasMfa) {
      const mfaToken = await this.createMfaSession(userId);
      return { requiresMfa: true, mfaToken };
    }

    const tokens = await this.issueTokens(userId, ipAddress, userAgent);
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });

    return { requiresMfa: false, tokens };
  }

  async validateMfa(mfaToken: string, code: string, ipAddress: string, userAgent?: string): Promise<TokenPair> {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: this.hashToken(mfaToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }

    const isValid = await this.mfaService.validateCode(session.userId, code);
    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });

    const tokens = await this.issueTokens(session.userId, ipAddress, userAgent);
    await this.prisma.user.update({ where: { id: session.userId }, data: { lastLoginAt: new Date() } });

    return tokens;
  }

  async refreshToken(refreshToken: string, ipAddress: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findFirst({
        where: { refreshTokenHash: tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Atomic revoke — only one concurrent request wins (second gets count=0)
      const { count } = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (count === 0) {
        throw new UnauthorizedException('Refresh token already used');
      }

      return this.issueTokens(session.userId, ipAddress);
    });
  }

  async revokeSession(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { userId, refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(userId: string, ipAddress: string, userAgent?: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const roles = [...new Set(user.userRoles.map((ur) => ur.role.slug))];
    const scopes = [...new Set(user.userRoles.map((ur) => ur.role.scope))];
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map(
            (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scopeType}`,
          ),
        ),
      ),
    ];

    const jti = randomUUID();
    const jwtConfig = this.configService.get<AppConfig['jwt']>('jwt');

    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.orgId,
      roles,
      scopes,
      permissions,
      jti,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomUUID();
    const refreshTokenHash = this.hashToken(refreshToken);

    const expiresInSeconds = this.parseExpiresIn(jwtConfig?.refreshExpiresIn ?? '7d');

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress,
        deviceInfo: userAgent ? { userAgent } : undefined,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(jwtConfig?.expiresIn ?? '15m'),
    };
  }

  private async createMfaSession(userId: string): Promise<string> {
    const token = randomUUID();
    const tokenHash = this.hashToken(token);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 900;
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return num * (multipliers[unit] ?? 1);
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
  }

  async getJwks(): Promise<object> {
    const jwtConfig = this.configService.get<AppConfig['jwt']>('jwt');
    const publicKeyPem = jwtConfig?.publicKey;

    if (!publicKeyPem) {
      return { keys: [] };
    }

    const keyObject = crypto.createPublicKey(publicKeyPem);
    const jwk = keyObject.export({ format: 'jwk' }) as Record<string, string>;

    return {
      keys: [
        {
          ...jwk,
          use: 'sig',
          alg: 'RS256',
          kid: '1',
        },
      ],
    };
  }
}
