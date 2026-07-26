import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminScope } from '../../common/decorators/scope.decorator';
import { OrganizationsService } from '../../modules/organizations/organizations.service';

/**
 * ADMIN surface — clients (tenants) management.
 *
 * Mounted at `/api/v1/admin/clients`. `@AdminScope()` restricts it to users
 * carrying a GLOBAL-scoped role (the internal Bass administrative environment),
 * enforced by `ScopeGuard`. This is where the platform sees and manages ALL
 * clients of the gateway — as opposed to the tenant-scoped client surface.
 */
@ApiTags('Admin · Clients')
@ApiBearerAuth()
@AdminScope()
@Controller('admin/clients')
export class AdminClientsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients (tenants) across the platform' })
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ): ReturnType<OrganizationsService['findAll']> {
    return this.organizations.findAll({ type, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single client (tenant) by id' })
  findOne(@Param('id') id: string): ReturnType<OrganizationsService['findById']> {
    return this.organizations.findById(id);
  }
}
