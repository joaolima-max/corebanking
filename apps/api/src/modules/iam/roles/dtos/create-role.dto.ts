import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

enum RoleScope {
  GLOBAL = 'GLOBAL',
  ORGANIZATION = 'ORGANIZATION',
  WHITE_LABEL = 'WHITE_LABEL',
  MERCHANT = 'MERCHANT',
}

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  slug!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: RoleScope })
  @IsEnum(RoleScope)
  scope!: RoleScope;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  orgId?: string;
}
