import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

enum OrgType {
  BASS = 'BASS',
  WHITE_LABEL = 'WHITE_LABEL',
  COMPANY = 'COMPANY',
  MERCHANT = 'MERCHANT',
}

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  slug!: string;

  @ApiProperty({ enum: OrgType })
  @IsEnum(OrgType)
  type!: OrgType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, unknown>;
}
