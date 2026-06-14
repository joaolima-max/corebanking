import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  async enrollTotp(userId: string, userEmail: string): Promise<{ factorId: string; qrCodeDataUrl: string; secret: string }> {
    const secret = speakeasy.generateSecret({
      name: `Bass Pago (${userEmail})`,
      issuer: 'Bass Pago',
      length: 32,
    });

    const factor = await this.prisma.mfaFactor.create({
      data: {
        userId,
        method: 'TOTP',
        secret: secret.base32,
        isPrimary: false,
        isVerified: false,
      },
    });

    const otpauthUrl = secret.otpauth_url ?? '';
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      factorId: factor.id,
      qrCodeDataUrl,
      secret: secret.base32,
    };
  }

  async verifyAndActivate(userId: string, factorId: string, code: string): Promise<void> {
    const factor = await this.prisma.mfaFactor.findFirst({
      where: { id: factorId, userId, isVerified: false },
    });

    if (!factor) {
      throw new NotFoundException('MFA factor not found or already verified');
    }

    const isValid = speakeasy.totp.verify({
      secret: factor.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid TOTP code');
    }

    await this.prisma.$transaction([
      this.prisma.mfaFactor.update({
        where: { id: factorId },
        data: { isVerified: true, isPrimary: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      }),
    ]);
  }

  async validateCode(userId: string, code: string): Promise<boolean> {
    const factor = await this.prisma.mfaFactor.findFirst({
      where: { userId, isVerified: true, isPrimary: true },
    });

    if (!factor) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: factor.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }

  async hasMfa(userId: string): Promise<boolean> {
    const count = await this.prisma.mfaFactor.count({
      where: { userId, isVerified: true },
    });
    return count > 0;
  }
}
