import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export enum OrgCreationMode {
  NEW = 'new',
  EXISTING = 'existing',
}

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Str0ng!Pass' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password!: string;

  @ApiPropertyOptional({ enum: OrgCreationMode, default: OrgCreationMode.NEW })
  @IsEnum(OrgCreationMode)
  @IsOptional()
  orgMode?: OrgCreationMode = OrgCreationMode.NEW;

  @ApiPropertyOptional({ description: 'Organization name (required if orgMode=new)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  orgName?: string;

  @ApiPropertyOptional({ description: 'Existing org ID (required if orgMode=existing)' })
  @IsString()
  @IsOptional()
  existingOrgId?: string;
}
