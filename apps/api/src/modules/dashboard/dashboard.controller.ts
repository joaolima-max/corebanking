import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Permissions('dashboard:read:own_org')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('executive')
  @ApiOperation({ summary: 'Executive metrics — balances, counts, revenue' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  getExecutiveMetrics(@Query('orgId') orgId?: string) {
    return this.dashboardService.getExecutiveMetrics(orgId);
  }

  @Get('operations')
  @ApiOperation({ summary: 'Operations metrics — TPS, transaction counts, time-series volume' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  getOperationsMetrics(@Query('orgId') orgId?: string) {
    return this.dashboardService.getOperationsMetrics(orgId);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Ledger metrics — debit/credit totals, balance check, account counts' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  getLedgerMetrics(@Query('orgId') orgId?: string) {
    return this.dashboardService.getLedgerMetrics(orgId);
  }

  @Get('treasury')
  @ApiOperation({ summary: 'Treasury metrics — cash position and funding (prepared)' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  getTreasuryMetrics(@Query('orgId') orgId?: string) {
    return this.dashboardService.getTreasuryMetrics(orgId);
  }

  @Get('risk')
  @ApiOperation({ summary: 'Risk metrics — blocked accounts/users, compliance (partial)' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  getRiskMetrics(@Query('orgId') orgId?: string) {
    return this.dashboardService.getRiskMetrics(orgId);
  }

  @Get('pix')
  @ApiOperation({ summary: 'PIX metrics (prepared — zeros)' })
  getPixMetrics() {
    return this.dashboardService.getPixMetrics();
  }

  @Get('acquiring')
  @ApiOperation({ summary: 'Acquiring metrics (prepared — zeros)' })
  getAcquiringMetrics() {
    return this.dashboardService.getAcquiringMetrics();
  }

  @Get('observability')
  @ApiOperation({ summary: 'Observability metrics — uptime, memory, DB and Redis health' })
  getObservabilityMetrics() {
    return this.dashboardService.getObservabilityMetrics();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Active alerts derived from real data' })
  @ApiQuery({ name: 'orgId', required: false, type: String })
  getAlerts(@Query('orgId') orgId?: string) {
    return this.dashboardService.getAlerts(orgId);
  }
}
