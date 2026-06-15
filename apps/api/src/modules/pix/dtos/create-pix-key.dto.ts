import { IsEnum, IsString, IsUUID } from 'class-validator';
import { PixKeyType } from '@prisma/client';

export class CreatePixKeyDto {
  @IsUUID()
  accountId: string;

  @IsEnum(PixKeyType)
  keyType: PixKeyType;

  @IsString()
  keyValue: string;
}
