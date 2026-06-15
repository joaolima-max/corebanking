import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PixKeyType } from '@prisma/client';

export class CreatePixTransferDto {
  @IsUUID()
  senderAccountId: string;

  @IsEnum(PixKeyType)
  pixKeyType: PixKeyType;

  @IsString()
  pixKey: string;

  @IsString()
  amount: string; // string to preserve decimal precision

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
