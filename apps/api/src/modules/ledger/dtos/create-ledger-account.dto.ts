import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

enum LedgerAccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export class CreateLedgerAccountDto {
  @ApiProperty()
  @IsUUID()
  orgId!: string;

  @ApiProperty({ description: 'Account code e.g. 1.1.1' })
  @IsString()
  @MaxLength(20)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: LedgerAccountType })
  @IsEnum(LedgerAccountType)
  type!: LedgerAccountType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ default: 'BRL' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
