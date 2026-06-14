import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { AssignPermissionDto } from './dtos/assign-permission.dto';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles:read:any')
  @ApiOperation({ summary: 'List roles' })
  findAll(@Query('scope') scope?: string, @Query('orgId') orgId?: string) {
    return this.rolesService.findAll({ scope, orgId });
  }

  @Post()
  @Permissions('roles:create:own_org')
  @ApiOperation({ summary: 'Create role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get(':id')
  @Permissions('roles:read:any')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  @Permissions('roles:create:own_org')
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateRoleDto>) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('roles:create:own_org')
  @ApiOperation({ summary: 'Delete role (non-system only)' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Get(':id/permissions')
  @Permissions('roles:read:any')
  @ApiOperation({ summary: 'List role permissions' })
  getPermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Post(':id/permissions')
  @Permissions('roles:create:own_org')
  @ApiOperation({ summary: 'Assign permission to role' })
  assignPermission(@Param('id') id: string, @Body() dto: AssignPermissionDto) {
    return this.rolesService.assignPermission(id, dto.permissionId);
  }

  @Delete(':id/permissions/:permId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('roles:create:own_org')
  @ApiOperation({ summary: 'Remove permission from role' })
  removePermission(@Param('id') id: string, @Param('permId') permId: string) {
    return this.rolesService.removePermission(id, permId);
  }
}
