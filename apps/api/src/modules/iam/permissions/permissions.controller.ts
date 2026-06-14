import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('roles:read:any')
  @ApiOperation({ summary: 'List all system permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Permissions('roles:read:any')
  @ApiOperation({ summary: 'Get permission by ID' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findById(id);
  }
}
