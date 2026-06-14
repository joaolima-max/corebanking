import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum EntryDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export class JournalEntryLineDto {
  @ApiProperty()
  @IsUUID()
  ledgerAccountId!: string;

  @ApiProperty({ enum: EntryDirection })
  @IsEnum(EntryDirection)
  direction!: EntryDirection;

  @ApiProperty({ description: 'Amount in minor units (e.g. centavos)', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ default: 'BRL' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty()
  @IsUUID()
  orgId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ description: 'Client-supplied idempotency key' })
  @IsString()
  @MaxLength(100)
  idempotencyKey!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiProperty({ type: [JournalEntryLineDto], minItems: 2 })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines!: JournalEntryLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
