import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AppConfig } from '../../config/configuration';

export interface ExecutiveMetrics {
  balances: {
    custodied: string;
    operational: string;
    reserve: string;
    settlement: string;
    blocked: string;
    total: string;
  };
  counts: {
    accounts: number;
    organizations: number;
    users: number;
    transactions: number;
    activeUsers: number;
    blockedUsers: number;
  };
  revenue: {
    accumulated: string;
    monthly: string;
    daily: string;
  };
  financialVolume: string;
  currency: string;
}

export interface OperationsMetrics {
  transactions: {
    today: number;
    lastHour: number;
    lastMinute: number;
    total: number;
    pending: number;
    voided: number;
    successRate: number;
    failureRate: number;
  };
  tps: {
    average: number;
    peak: number;
  };
  volumeByHour: Array<{ hour: string; count: number; volume: string }>;
  volumeByDay: Array<{ day: string; count: number; volume: string }>;
  volumeByMonth: Array<{ month: string; count: number; volume: string }>;
}

export interface LedgerMetrics {
  totals: {
    debits: string;
    credits: string;
    balance: string;
    divergence: string;
    isBalanced: boolean;
  };
  accounts: {
    total: number;
    active: number;
    inactive: number;
  };
  operationalAccounts: {
    total: number;
    active: number;
    blocked: number;
    closed: number;
  };
  alerts: {
    outOfBalance: boolean;
    divergenceAmount: string;
  };
}

export interface TreasuryMetrics {
  prepared: true;
  cashPosition: {
    consolidated: string;
    available: string;
    reserved: string;
    projected: string;
  };
  funding: {
    utilized: string;
    available: string;
  };
  currency: 'BRL';
}

export interface RiskMetrics {
  prepared: true;
  accounts: {
    blocked: number;
    underReview: number;
  };
  users: {
    blocked: number;
    pendingMfa: number;
  };
  compliance: {
    alerts: number;
    pendingReview: number;
  };
  recentBlockEvents: Array<{
    id: string;
    action: string;
    resourceType: string;
    createdAt: string;
  }>;
}

export interface PixMetrics {
  prepared: true;
  in: { count: number; volume: string };
  out: { count: number; volume: string };
  meds: number;
  dictConsults: number;
  pixKeys: number;
  conversionRate: number;
  currency: 'BRL';
}

export interface AcquiringMetrics {
  prepared: true;
  tpv: string;
  mdr: string;
  chargebacks: number;
  receivables: string;
  anticipations: string;
  splitPayments: number;
  currency: 'BRL';
}

export interface ObservabilityMetrics {
  database: {
    status: 'ok' | 'unhealthy';
    latencyMs: number;
    connections: number;
  };
  redis: {
    status: 'ok' | 'unhealthy';
    latencyMs: number;
  };
  process: {
    memoryUsedMb: number;
    memoryTotalMb: number;
    uptimeSeconds: number;
    nodeVersion: string;
  };
  api: {
    requestsPerMinute: number;
    avgLatencyMs: number;
    p99LatencyMs: number;
  };
}

export interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AlertsData {
  summary: { critical: number; warning: number; info: number; total: number };
  alerts: Alert[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly startedAt = new Date().toISOString();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig>,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  async getExecutiveMetrics(orgId?: string): Promise<ExecutiveMetrics> {
    const orgFilter = orgId ? { orgId } : {};

    // Balance aggregations
    const [
      custodiedResult,
      operationalResult,
      reserveResult,
      settlementResult,
      blockedResult,
      totalResult,
    ] = await Promise.all([
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter, type: { in: ['CLIENT', 'ESCROW'] } } },
      }),
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter, type: 'OPERATIONAL' } },
      }),
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter, type: 'RESERVE' } },
      }),
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter, type: 'SETTLEMENT' } },
      }),
      this.prisma.accountBalance.aggregate({
        _sum: { blockedAmount: true },
        where: { account: { ...orgFilter } },
      }),
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter } },
      }),
    ]);

    // Count aggregations
    const [
      accountsCount,
      orgsCount,
      usersCount,
      transactionsCount,
      activeUsersCount,
      blockedUsersCount,
      voidedCount,
    ] = await Promise.all([
      this.prisma.account.count({ where: { ...orgFilter, status: { not: 'CLOSED' } } }),
      this.prisma.organization.count({ where: orgId ? { id: orgId } : {} }),
      this.prisma.user.count({ where: { ...orgFilter, status: { not: 'INACTIVE' } } }),
      this.prisma.journalEntry.count({ where: { ...orgFilter, status: 'POSTED' } }),
      this.prisma.user.count({ where: { ...orgFilter, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { ...orgFilter, status: 'BLOCKED' } }),
      this.prisma.journalEntry.count({ where: { ...orgFilter, status: 'VOIDED' } }),
    ]);

    // Revenue aggregations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const revenueFilter = {
      direction: 'CREDIT' as const,
      ledgerAccount: { ...orgFilter, type: 'REVENUE' as const },
    };

    const [revenueAccumulated, revenueMonthly, revenueDaily, financialVolumeResult] =
      await Promise.all([
        this.prisma.journalEntryLine.aggregate({
          _sum: { amount: true },
          where: revenueFilter,
        }),
        this.prisma.journalEntryLine.aggregate({
          _sum: { amount: true },
          where: {
            ...revenueFilter,
            journalEntry: { createdAt: { gte: startOfMonth } },
          },
        }),
        this.prisma.journalEntryLine.aggregate({
          _sum: { amount: true },
          where: {
            ...revenueFilter,
            journalEntry: { createdAt: { gte: startOfDay } },
          },
        }),
        this.prisma.journalEntryLine.aggregate({
          _sum: { amount: true },
          where: {
            direction: 'DEBIT',
            ...(orgId ? { ledgerAccount: { orgId } } : {}),
          },
        }),
      ]);

    const zero = new Prisma.Decimal(0);

    return {
      balances: {
        custodied: (custodiedResult._sum.availableAmount ?? zero).toString(),
        operational: (operationalResult._sum.availableAmount ?? zero).toString(),
        reserve: (reserveResult._sum.availableAmount ?? zero).toString(),
        settlement: (settlementResult._sum.availableAmount ?? zero).toString(),
        blocked: (blockedResult._sum.blockedAmount ?? zero).toString(),
        total: (totalResult._sum.availableAmount ?? zero).toString(),
      },
      counts: {
        accounts: accountsCount,
        organizations: orgsCount,
        users: usersCount,
        transactions: transactionsCount,
        activeUsers: activeUsersCount,
        blockedUsers: blockedUsersCount,
      },
      revenue: {
        accumulated: (revenueAccumulated._sum.amount ?? zero).toString(),
        monthly: (revenueMonthly._sum.amount ?? zero).toString(),
        daily: (revenueDaily._sum.amount ?? zero).toString(),
      },
      financialVolume: (financialVolumeResult._sum.amount ?? zero).toString(),
      currency: 'BRL',
    };
  }

  async getOperationsMetrics(orgId?: string): Promise<OperationsMetrics> {
    const orgFilter = orgId ? { orgId } : {};
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const [todayCount, lastHourCount, lastMinuteCount, totalCount, voidedCount] =
      await Promise.all([
        this.prisma.journalEntry.count({
          where: { ...orgFilter, status: 'POSTED', createdAt: { gte: startOfDay } },
        }),
        this.prisma.journalEntry.count({
          where: { ...orgFilter, status: 'POSTED', createdAt: { gte: oneHourAgo } },
        }),
        this.prisma.journalEntry.count({
          where: { ...orgFilter, status: 'POSTED', createdAt: { gte: oneMinuteAgo } },
        }),
        this.prisma.journalEntry.count({ where: { ...orgFilter } }),
        this.prisma.journalEntry.count({ where: { ...orgFilter, status: 'VOIDED' } }),
      ]);

    const postedCount = totalCount - voidedCount;
    const successRate = totalCount > 0 ? (postedCount / totalCount) * 100 : 0;
    const failureRate = 100 - successRate;
    const averageTps = lastHourCount / 3600;

    // Peak TPS: max transactions in any 1-minute window in the last hour
    let peakTps = 0;
    try {
      const orgCondition = orgId ? Prisma.sql`AND je.org_id = ${orgId}` : Prisma.sql``;
      const peakRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(je.id) AS count
        FROM journal_entries je
        WHERE je.created_at >= NOW() - INTERVAL '1 hour'
          AND je.status = 'POSTED'::"JournalEntryStatus"
          ${orgCondition}
        GROUP BY DATE_TRUNC('minute', je.created_at)
        ORDER BY count DESC
        LIMIT 1
      `;
      if (peakRows.length > 0) {
        peakTps = Number(peakRows[0].count) / 60;
      }
    } catch (err) {
      this.logger.warn('Failed to compute peak TPS', err);
    }

    // Time-series queries
    const orgRawCondition = orgId ? Prisma.sql`AND je.org_id = ${orgId}` : Prisma.sql``;

    const [hourlyRows, dailyRows, monthlyRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ period: Date; count: bigint; volume: Prisma.Decimal | null }>>`
        SELECT
          DATE_TRUNC('hour', je.created_at) AS period,
          COUNT(je.id) AS count,
          COALESCE(SUM(jel.amount), 0) AS volume
        FROM journal_entries je
        LEFT JOIN journal_entry_lines jel
          ON jel.journal_entry_id = je.id AND jel.direction = 'DEBIT'::"EntryDirection"
        WHERE je.created_at >= NOW() - INTERVAL '24 hours'
          AND je.status = 'POSTED'::"JournalEntryStatus"
          ${orgRawCondition}
        GROUP BY DATE_TRUNC('hour', je.created_at)
        ORDER BY period ASC
      `,
      this.prisma.$queryRaw<Array<{ period: Date; count: bigint; volume: Prisma.Decimal | null }>>`
        SELECT
          DATE_TRUNC('day', je.created_at) AS period,
          COUNT(je.id) AS count,
          COALESCE(SUM(jel.amount), 0) AS volume
        FROM journal_entries je
        LEFT JOIN journal_entry_lines jel
          ON jel.journal_entry_id = je.id AND jel.direction = 'DEBIT'::"EntryDirection"
        WHERE je.created_at >= NOW() - INTERVAL '30 days'
          AND je.status = 'POSTED'::"JournalEntryStatus"
          ${orgRawCondition}
        GROUP BY DATE_TRUNC('day', je.created_at)
        ORDER BY period ASC
      `,
      this.prisma.$queryRaw<Array<{ period: Date; count: bigint; volume: Prisma.Decimal | null }>>`
        SELECT
          DATE_TRUNC('month', je.created_at) AS period,
          COUNT(je.id) AS count,
          COALESCE(SUM(jel.amount), 0) AS volume
        FROM journal_entries je
        LEFT JOIN journal_entry_lines jel
          ON jel.journal_entry_id = je.id AND jel.direction = 'DEBIT'::"EntryDirection"
        WHERE je.created_at >= NOW() - INTERVAL '12 months'
          AND je.status = 'POSTED'::"JournalEntryStatus"
          ${orgRawCondition}
        GROUP BY DATE_TRUNC('month', je.created_at)
        ORDER BY period ASC
      `,
    ]);

    const zero = new Prisma.Decimal(0);

    return {
      transactions: {
        today: todayCount,
        lastHour: lastHourCount,
        lastMinute: lastMinuteCount,
        total: totalCount,
        pending: 0,
        voided: voidedCount,
        successRate: Math.round(successRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
      },
      tps: {
        average: Math.round(averageTps * 10000) / 10000,
        peak: Math.round(peakTps * 10000) / 10000,
      },
      volumeByHour: hourlyRows.map((row) => ({
        hour: row.period.toISOString(),
        count: Number(row.count),
        volume: (row.volume ?? zero).toString(),
      })),
      volumeByDay: dailyRows.map((row) => ({
        day: row.period.toISOString(),
        count: Number(row.count),
        volume: (row.volume ?? zero).toString(),
      })),
      volumeByMonth: monthlyRows.map((row) => ({
        month: row.period.toISOString(),
        count: Number(row.count),
        volume: (row.volume ?? zero).toString(),
      })),
    };
  }

  async getLedgerMetrics(orgId?: string): Promise<LedgerMetrics> {
    const orgFilter = orgId ? { orgId } : {};
    const ledgerOrgFilter = orgId ? { ledgerAccount: { orgId } } : {};

    const [debitsResult, creditsResult, ledgerAccountStats, operationalAccountStats] =
      await Promise.all([
        this.prisma.journalEntryLine.aggregate({
          _sum: { amount: true },
          where: { direction: 'DEBIT', ...ledgerOrgFilter },
        }),
        this.prisma.journalEntryLine.aggregate({
          _sum: { amount: true },
          where: { direction: 'CREDIT', ...ledgerOrgFilter },
        }),
        this.prisma.ledgerAccount.groupBy({
          by: ['isActive'],
          _count: { id: true },
          where: { ...orgFilter },
        }),
        this.prisma.account.groupBy({
          by: ['status'],
          _count: { id: true },
          where: { ...orgFilter },
        }),
      ]);

    const zero = new Prisma.Decimal(0);
    const debits = debitsResult._sum.amount ?? zero;
    const credits = creditsResult._sum.amount ?? zero;
    const balance = debits.minus(credits);
    const divergence = balance.abs();
    const isBalanced = divergence.lessThanOrEqualTo(new Prisma.Decimal('0.01'));

    const activeLedger = ledgerAccountStats.find((g) => g.isActive === true)?._count.id ?? 0;
    const inactiveLedger = ledgerAccountStats.find((g) => g.isActive === false)?._count.id ?? 0;
    const totalLedger = activeLedger + inactiveLedger;

    const getStatusCount = (status: string) =>
      operationalAccountStats.find((g) => g.status === status)?._count.id ?? 0;

    const activeOp = getStatusCount('ACTIVE');
    const blockedOp = getStatusCount('BLOCKED');
    const closedOp = getStatusCount('CLOSED');
    const totalOp = activeOp + blockedOp + closedOp;

    return {
      totals: {
        debits: debits.toString(),
        credits: credits.toString(),
        balance: balance.toString(),
        divergence: divergence.toString(),
        isBalanced,
      },
      accounts: {
        total: totalLedger,
        active: activeLedger,
        inactive: inactiveLedger,
      },
      operationalAccounts: {
        total: totalOp,
        active: activeOp,
        blocked: blockedOp,
        closed: closedOp,
      },
      alerts: {
        outOfBalance: !isBalanced,
        divergenceAmount: divergence.toString(),
      },
    };
  }

  async getTreasuryMetrics(orgId?: string): Promise<TreasuryMetrics> {
    const zero = new Prisma.Decimal(0);
    const orgFilter = orgId ? { orgId } : {};

    const [operationalResult, reserveResult, custodiedResult] = await Promise.all([
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter, type: 'OPERATIONAL' } },
      }),
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter, type: 'RESERVE' } },
      }),
      this.prisma.accountBalance.aggregate({
        _sum: { availableAmount: true },
        where: { account: { ...orgFilter, type: { in: ['CLIENT', 'ESCROW'] } } },
      }),
    ]);

    const operational = operationalResult._sum.availableAmount ?? zero;
    const reserve = reserveResult._sum.availableAmount ?? zero;
    const custodied = custodiedResult._sum.availableAmount ?? zero;
    const projected = operational.plus(reserve);

    return {
      prepared: true,
      cashPosition: {
        consolidated: operational.toString(),
        available: operational.toString(),
        reserved: reserve.toString(),
        projected: projected.toString(),
      },
      funding: {
        utilized: '0.00',
        available: custodied.toString(),
      },
      currency: 'BRL',
    };
  }

  async getRiskMetrics(orgId?: string): Promise<RiskMetrics> {
    const orgFilter = orgId ? { orgId } : {};

    const [blockedAccounts, blockedUsers, pendingMfaUsers, recentBlockEvents] = await Promise.all([
      this.prisma.account.count({ where: { ...orgFilter, status: 'BLOCKED' } }),
      this.prisma.user.count({ where: { ...orgFilter, status: 'BLOCKED' } }),
      this.prisma.user.count({ where: { ...orgFilter, status: 'PENDING_MFA' } }),
      this.prisma.auditLog.findMany({
        where: {
          ...(orgId ? { orgId } : {}),
          action: { in: ['ACCOUNT_BLOCK', 'ACCOUNT_UNBLOCK'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, action: true, resourceType: true, createdAt: true },
      }),
    ]);

    return {
      prepared: true,
      accounts: {
        blocked: blockedAccounts,
        underReview: 0,
      },
      users: {
        blocked: blockedUsers,
        pendingMfa: pendingMfaUsers,
      },
      compliance: {
        alerts: 0,
        pendingReview: 0,
      },
      recentBlockEvents: recentBlockEvents.map((e) => ({
        id: e.id,
        action: e.action,
        resourceType: e.resourceType,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  async getPixMetrics(): Promise<PixMetrics> {
    return {
      prepared: true,
      in: { count: 0, volume: '0.00' },
      out: { count: 0, volume: '0.00' },
      meds: 0,
      dictConsults: 0,
      pixKeys: 0,
      conversionRate: 0,
      currency: 'BRL',
    };
  }

  async getAcquiringMetrics(): Promise<AcquiringMetrics> {
    return {
      prepared: true,
      tpv: '0.00',
      mdr: '0.00',
      chargebacks: 0,
      receivables: '0.00',
      anticipations: '0.00',
      splitPayments: 0,
      currency: 'BRL',
    };
  }

  async getObservabilityMetrics(): Promise<ObservabilityMetrics> {
    const mem = process.memoryUsage();
    const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

    // Database health check
    let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy';
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'healthy';
    } catch (err) {
      this.logger.warn('Database health check failed', err);
    }

    // Redis health check
    let redisStatus: 'healthy' | 'unhealthy' = 'unhealthy';
    let redisLatencyMs = 0;
    try {
      const redisStart = Date.now();
      await this.redisClient.ping();
      redisLatencyMs = Date.now() - redisStart;
      redisStatus = 'healthy';
    } catch (err) {
      this.logger.warn('Redis health check failed', err);
    }

    return {
      database: {
        status: dbStatus === 'healthy' ? 'ok' : 'unhealthy',
        latencyMs: dbLatencyMs,
        connections: 1,
      },
      redis: {
        status: redisStatus === 'healthy' ? 'ok' : 'unhealthy',
        latencyMs: redisLatencyMs,
      },
      process: {
        memoryUsedMb: toMb(mem.heapUsed),
        memoryTotalMb: toMb(mem.heapTotal),
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
      },
      api: {
        requestsPerMinute: 0,
        avgLatencyMs: 0,
        p99LatencyMs: 0,
      },
    };
  }

  async getAlerts(orgId?: string): Promise<AlertsData> {
    const orgFilter = orgId ? { orgId } : {};

    const [ledgerMetrics, blockedAccounts, blockedUsers, recentAuditLogs, recentNewUsers] =
      await Promise.all([
        this.getLedgerMetrics(orgId),
        this.prisma.account.count({ where: { ...orgFilter, status: 'BLOCKED' } }),
        this.prisma.user.count({ where: { ...orgFilter, status: 'BLOCKED' } }),
        this.prisma.auditLog.findMany({
          where: {
            ...(orgId ? { orgId } : {}),
            action: { in: ['ACCOUNT_BLOCK', 'ACCOUNT_UNBLOCK'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, action: true, resourceType: true, createdAt: true, userId: true },
        }),
        this.prisma.user.findMany({
          where: {
            ...orgFilter,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { id: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const critical: Alert[] = [];
    const warnings: Alert[] = [];
    const info: Alert[] = [];

    // CRITICAL: ledger out of balance
    if (!ledgerMetrics.totals.isBalanced) {
      critical.push({
        id: 'ledger-out-of-balance',
        type: 'LEDGER_IMBALANCE',
        severity: 'critical',
        title: 'Ledger Fora de Balanço',
        description: `Divergência de ${ledgerMetrics.totals.divergence} BRL detectada entre débitos e créditos.`,
        timestamp: new Date().toISOString(),
        metadata: { divergence: ledgerMetrics.totals.divergence },
      });
    }

    // CRITICAL: blocked accounts
    if (blockedAccounts > 0) {
      critical.push({
        id: 'blocked-accounts',
        type: 'ACCOUNT_BLOCKED',
        severity: 'critical',
        title: `${blockedAccounts} Conta(s) Bloqueada(s)`,
        description: `Existem ${blockedAccounts} conta(s) com status BLOCKED que requerem atenção.`,
        timestamp: new Date().toISOString(),
        metadata: { count: blockedAccounts },
      });
    }

    // WARNING: blocked users
    if (blockedUsers > 0) {
      warnings.push({
        id: 'blocked-users',
        type: 'USER_BLOCKED',
        severity: 'warning',
        title: `${blockedUsers} Usuário(s) Bloqueado(s)`,
        description: `Existem ${blockedUsers} usuário(s) com status BLOCKED.`,
        timestamp: new Date().toISOString(),
        metadata: { count: blockedUsers },
      });
    }

    // INFO: recent block/unblock audit events
    for (const log of recentAuditLogs) {
      info.push({
        id: `audit-${log.id}`,
        type: log.action,
        severity: 'info',
        title: log.action === 'ACCOUNT_BLOCK' ? 'Conta Bloqueada' : 'Conta Desbloqueada',
        description: `Evento ${log.action} em ${log.resourceType} por usuário ${log.userId}.`,
        timestamp: log.createdAt.toISOString(),
        metadata: { resourceType: log.resourceType, userId: log.userId },
      });
    }

    // INFO: new users in the last 24h
    if (recentNewUsers.length > 0) {
      info.push({
        id: 'new-users-24h',
        type: 'NEW_USERS',
        severity: 'info',
        title: `${recentNewUsers.length} Novo(s) Usuário(s) nas Últimas 24h`,
        description: `${recentNewUsers.length} usuário(s) criados nas últimas 24 horas.`,
        timestamp: new Date().toISOString(),
        metadata: { count: recentNewUsers.length },
      });
    }

    const allAlerts = [...critical, ...warnings, ...info];
    return {
      summary: {
        critical: critical.length,
        warning: warnings.length,
        info: info.length,
        total: allAlerts.length,
      },
      alerts: allAlerts,
    };
  }
}
