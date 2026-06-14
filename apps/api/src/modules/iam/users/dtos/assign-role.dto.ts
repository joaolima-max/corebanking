import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty()
  @IsUUID()
  roleId!: string;

  @ApiPropertyOptional({ description: 'Context org for this role assignment' })
  @IsUUID()
  @IsOptional()
  orgId?: string;

  @ApiPropertyOptional({ description: 'ISO date when role expires' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
