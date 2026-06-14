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
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AssignRoleDto } from './dtos/assign-role.dto';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users:read:own_org')
  @ApiOperation({ summary: 'List users' })
  findAll(
    @Query('orgId') orgId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll({
      orgId,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @Permissions('users:create:own_org')
  @ApiOperation({ summary: 'Create user' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Get(':id')
  @Permissions('users:read:own_org')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Permissions('users:update:own_org')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('users:delete:own_org')
  @ApiOperation({ summary: 'Soft delete user' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.remove(id, user);
  }

  @Post(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('users:block:own_org')
  @ApiOperation({ summary: 'Block user' })
  block(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.block(id, user);
  }

  @Post(':id/unblock')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('users:block:own_org')
  @ApiOperation({ summary: 'Unblock user' })
  unblock(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.unblock(id, user);
  }

  @Get(':id/roles')
  @Permissions('users:read:own_org')
  @ApiOperation({ summary: 'List user roles' })
  getUserRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(id);
  }

  @Post(':id/roles')
  @Permissions('roles:assign:below_self')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto, @CurrentUser() user: AuthUser) {
    return this.usersService.assignRole(id, dto, user);
  }

  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('roles:assign:below_self')
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string, @CurrentUser() user: AuthUser) {
    return this.usersService.removeRole(id, roleId, user);
  }

  @Get(':id/sessions')
  @Permissions('users:read:own_org')
  @ApiOperation({ summary: 'List active sessions' })
  getUserSessions(@Param('id') id: string) {
    return this.usersService.getUserSessions(id);
  }
}
