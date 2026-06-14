import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @Permissions('accounts:read:own_org')
  @ApiOperation({ summary: 'List accounts' })
  findAll(
    @Query('orgId') orgId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountsService.findAll({
      orgId,
      type,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @Permissions('accounts:create:own_org')
  @ApiOperation({ summary: 'Create account' })
  create(@Body() dto: CreateAccountDto, @CurrentUser() user: AuthUser) {
    return this.accountsService.create(dto, user);
  }

  @Get(':id')
  @Permissions('accounts:read:own_org')
  @ApiOperation({ summary: 'Get account by ID' })
  findOne(@Param('id') id: string) {
    return this.accountsService.findById(id);
  }

  @Patch(':id')
  @Permissions('accounts:read:own_org')
  @ApiOperation({ summary: 'Update account' })
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.accountsService.update(id, dto, user);
  }

  @Post(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('accounts:block:own_org')
  @ApiOperation({ summary: 'Block account' })
  block(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.accountsService.block(id, user);
  }

  @Post(':id/unblock')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('accounts:block:own_org')
  @ApiOperation({ summary: 'Unblock account' })
  unblock(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.accountsService.unblock(id, user);
  }

  @Get(':id/balance')
  @Permissions('accounts:read:own_org')
  @ApiOperation({ summary: 'Get account balance' })
  getBalance(@Param('id') id: string) {
    return this.accountsService.getBalance(id);
  }

  @Get(':id/children')
  @Permissions('accounts:read:own_org')
  @ApiOperation({ summary: 'Get sub-accounts' })
  getChildren(@Param('id') id: string) {
    return this.accountsService.getChildren(id);
  }
}
