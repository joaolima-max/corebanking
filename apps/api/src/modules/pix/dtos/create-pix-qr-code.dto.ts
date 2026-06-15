import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PixQrCodeType } from '@prisma/client';

export class CreatePixQrCodeDto {
  @IsUUID()
  accountId: string;

  @IsUUID()
  pixKeyId: string;

  @IsEnum(PixQrCodeType)
  type: PixQrCodeType;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  expiresInMinutes?: number;
}
