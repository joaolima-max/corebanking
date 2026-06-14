import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dtos/create-organization.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Permissions('organizations:read:any')
  @ApiOperation({ summary: 'List organizations' })
  findAll(
    @Query('type') type?: string,
    @Query('parentId') parentId?: string,
    @Query('status') status?: string,
  ) {
    return this.organizationsService.findAll({ type, parentId, status });
  }

  @Post()
  @Permissions('organizations:create:any')
  @ApiOperation({ summary: 'Create organization' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get(':id')
  @Permissions('organizations:read:any')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  @Permissions('organizations:update:own')
  @ApiOperation({ summary: 'Update organization' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateOrganizationDto>) {
    return this.organizationsService.update(id, dto);
  }

  @Get(':id/children')
  @Permissions('organizations:read:any')
  @ApiOperation({ summary: 'Get child organizations' })
  getChildren(@Param('id') id: string) {
    return this.organizationsService.getChildren(id);
  }

  @Get(':id/accounts')
  @Permissions('accounts:read:own_org')
  @ApiOperation({ summary: 'Get organization accounts' })
  getAccounts(@Param('id') id: string) {
    return this.organizationsService.getAccounts(id);
  }

  @Get(':id/users')
  @Permissions('users:read:own_org')
  @ApiOperation({ summary: 'Get organization users' })
  getUsers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.organizationsService.getUsers(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
