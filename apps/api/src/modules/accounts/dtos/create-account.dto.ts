import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

enum AccountType {
  OPERATIONAL = 'OPERATIONAL',
  RESERVE = 'RESERVE',
  SETTLEMENT = 'SETTLEMENT',
  CLIENT = 'CLIENT',
  ESCROW = 'ESCROW',
}

export class CreateAccountDto {
  @ApiProperty()
  @IsUUID()
  orgId!: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: 'BRL' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Parent account ID for sub-accounts' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
