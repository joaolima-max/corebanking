import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { CreateLedgerAccountDto } from './dtos/create-ledger-account.dto';
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Ledger')
@ApiBearerAuth()
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  // Ledger Accounts

  @Get('accounts')
  @Permissions('ledger:read:own_org')
  @ApiOperation({ summary: 'Chart of accounts (tree)' })
  getChartOfAccounts(@Query('orgId') orgId: string) {
    return this.ledgerService.getChartOfAccounts(orgId);
  }

  @Post('accounts')
  @Permissions('ledger:post:own_org')
  @ApiOperation({ summary: 'Create ledger account' })
  createLedgerAccount(@Body() dto: CreateLedgerAccountDto) {
    return this.ledgerService.createLedgerAccount(dto);
  }

  @Get('accounts/:id')
  @Permissions('ledger:read:own_org')
  @ApiOperation({ summary: 'Get ledger account' })
  getLedgerAccount(@Param('id') id: string) {
    return this.ledgerService.getLedgerAccount(id);
  }

  @Get('accounts/:id/balance')
  @Permissions('ledger:read:own_org')
  @ApiOperation({ summary: 'Get ledger account balance' })
  getLedgerAccountBalance(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ledgerService.getLedgerAccountBalance(id, { from, to });
  }

  // Journal Entries

  @Post('journal-entries')
  @Permissions('ledger:post:own_org')
  @ApiOperation({ summary: 'Post journal entry (Σ DEBIT must equal Σ CREDIT)' })
  postJournalEntry(@Body() dto: CreateJournalEntryDto, @CurrentUser() user: AuthUser) {
    return this.ledgerService.postJournalEntry(dto, user);
  }

  @Get('journal-entries')
  @Permissions('ledger:read:own_org')
  @ApiOperation({ summary: 'List journal entries' })
  listJournalEntries(
    @Query('orgId') orgId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('referenceId') referenceId?: string,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ledgerService.listJournalEntries({
      orgId,
      from,
      to,
      referenceId,
      status,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('journal-entries/:id')
  @Permissions('ledger:read:own_org')
  @ApiOperation({ summary: 'Get journal entry with lines' })
  getJournalEntry(@Param('id') id: string) {
    return this.ledgerService.getJournalEntry(id);
  }

  @Post('journal-entries/:id/void')
  @HttpCode(HttpStatus.OK)
  @Permissions('ledger:void:own_org')
  @ApiOperation({ summary: 'Void journal entry (creates compensating entry)' })
  voidJournalEntry(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ledgerService.voidJournalEntry(id, user);
  }

  // Reports

  @Get('trial-balance')
  @Permissions('ledger:trial_balance:own_org')
  @ApiOperation({ summary: 'Trial balance by period' })
  getTrialBalance(
    @Query('orgId') orgId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ledgerService.getTrialBalance({ orgId, from, to });
  }
}
