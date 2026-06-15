import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateLedgerAccountDto } from './dtos/create-ledger-account.dto';
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Ledger Accounts ---

  async getChartOfAccounts(orgId: string) {
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { orgId },
      orderBy: { code: 'asc' },
    });

    return this.buildTree(accounts);
  }

  async createLedgerAccount(dto: CreateLedgerAccountDto) {
    const existing = await this.prisma.ledgerAccount.findFirst({
      where: { orgId: dto.orgId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Ledger account code ${dto.code} already exists in this org`);

    if (dto.parentId) {
      const parent = await this.prisma.ledgerAccount.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent ledger account not found');
    }

    return this.prisma.ledgerAccount.create({
      data: {
        orgId: dto.orgId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId ?? null,
        currency: dto.currency ?? 'BRL',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getLedgerAccount(id: string) {
    const account = await this.prisma.ledgerAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Ledger account not found');
    return account;
  }

  async getLedgerAccountBalance(id: string, params?: { from?: string; to?: string }) {
    await this.getLedgerAccount(id);

    const where = {
      ledgerAccountId: id,
      journalEntry: {
        status: 'POSTED' as const,
        ...(params?.from || params?.to
          ? {
              postedAt: {
                ...(params.from ? { gte: new Date(params.from) } : {}),
                ...(params.to ? { lte: new Date(params.to) } : {}),
              },
            }
          : {}),
      },
    };

    const lines = await this.prisma.journalEntryLine.findMany({ where });

    let debitTotal = new Prisma.Decimal(0);
    let creditTotal = new Prisma.Decimal(0);

    for (const line of lines) {
      if (line.direction === 'DEBIT') {
        debitTotal = debitTotal.plus(line.amount);
      } else {
        creditTotal = creditTotal.plus(line.amount);
      }
    }

    return { ledgerAccountId: id, debitTotal, creditTotal, netBalance: debitTotal.minus(creditTotal) };
  }

  // --- Journal Entries ---

  async postJournalEntry(dto: CreateJournalEntryDto, actor: AuthUser) {
    // Validate double-entry invariant: Σ DEBIT == Σ CREDIT
    let debitSum = new Prisma.Decimal(0);
    let creditSum = new Prisma.Decimal(0);

    for (const line of dto.lines) {
      const amount = new Prisma.Decimal(line.amount);
      if (line.direction === 'DEBIT') {
        debitSum = debitSum.plus(amount);
      } else {
        creditSum = creditSum.plus(amount);
      }
    }

    if (!debitSum.equals(creditSum)) {
      throw new UnprocessableEntityException(
        `Double-entry invariant violated: DEBIT total (${debitSum}) ≠ CREDIT total (${creditSum})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Idempotency check inside transaction
      const existing = await tx.journalEntry.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { lines: true },
      });
      if (existing) return existing;

      const org = await tx.organization.findUnique({ where: { id: dto.orgId } });
      if (!org) throw new NotFoundException('Organization not found');

      // Validate all ledger accounts exist inside the same transaction
      const accountIds = [...new Set(dto.lines.map((l) => l.ledgerAccountId))];
      const ledgerAccounts = await tx.ledgerAccount.findMany({
        where: { id: { in: accountIds }, isActive: true },
      });
      if (ledgerAccounts.length !== accountIds.length) {
        throw new NotFoundException('One or more ledger accounts not found or inactive');
      }

      const now = new Date();

      const journalEntry = await tx.journalEntry.create({
        data: {
          orgId: dto.orgId,
          status: 'POSTED',
          description: dto.description,
          idempotencyKey: dto.idempotencyKey,
          referenceId: dto.referenceId ?? null,
          referenceType: dto.referenceType ?? null,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
          postedAt: now,
          createdBy: actor.id,
          lines: {
            create: dto.lines.map((line) => ({
              ledgerAccountId: line.ledgerAccountId,
              direction: line.direction,
              amount: new Prisma.Decimal(line.amount),
              currency: line.currency ?? 'BRL',
              description: line.description ?? null,
            })),
          },
        },
        include: { lines: true },
      });

      return journalEntry;
    });
  }

  async listJournalEntries(params: {
    orgId?: string;
    from?: string;
    to?: string;
    referenceId?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }) {
    const { orgId, from, to, referenceId, status, cursor } = params;
    const limit = Math.min(params.limit ?? 20, 100);

    const where = {
      ...(orgId ? { orgId } : {}),
      ...(referenceId ? { referenceId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(from || to
        ? {
            postedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const entries = await this.prisma.journalEntry.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { postedAt: 'desc' },
      include: { _count: { select: { lines: true } } },
    });

    const hasMore = entries.length > limit;
    const data = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return { data, meta: { nextCursor, hasMore } };
  }

  async getJournalEntry(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: { include: { ledgerAccount: true } } },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async voidJournalEntry(id: string, actor: AuthUser) {
    return this.prisma.$transaction(async (tx) => {
      // Read AND check status inside the transaction to prevent TOCTOU double-void
      const entry = await tx.journalEntry.findUnique({
        where: { id },
        include: { lines: { include: { ledgerAccount: true } } },
      });
      if (!entry) throw new NotFoundException('Journal entry not found');
      if (entry.status === 'VOIDED') {
        throw new ConflictException('Journal entry already voided');
      }

      await tx.journalEntry.update({
        where: { id },
        data: { status: 'VOIDED', voidedAt: new Date(), voidedBy: actor.id },
      });

      // Create compensating (reversing) entry
      const reversalEntry = await tx.journalEntry.create({
        data: {
          orgId: entry.orgId,
          status: 'POSTED',
          description: `VOID: ${entry.description}`,
          idempotencyKey: `void-${entry.idempotencyKey}`,
          referenceId: entry.id,
          referenceType: 'JournalEntryVoid',
          postedAt: new Date(),
          createdBy: actor.id,
          lines: {
            create: entry.lines.map((line) => ({
              ledgerAccountId: line.ledgerAccountId,
              direction: line.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT',
              amount: line.amount,
              currency: line.currency,
              description: `REVERSAL: ${line.description ?? ''}`,
            })),
          },
        },
        include: { lines: true },
      });

      return reversalEntry;
    });
  }

  async getTrialBalance(params: { orgId: string; from?: string; to?: string }) {
    const { orgId, from, to } = params;

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          orgId,
          status: 'POSTED',
          ...(from || to
            ? {
                postedAt: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(to) } : {}),
                },
              }
            : {}),
        },
      },
      include: { ledgerAccount: true },
    });

    const balances = new Map<string, { account: (typeof lines)[0]['ledgerAccount']; debit: Prisma.Decimal; credit: Prisma.Decimal }>();

    for (const line of lines) {
      const entry = balances.get(line.ledgerAccountId) ?? {
        account: line.ledgerAccount,
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0),
      };

      if (line.direction === 'DEBIT') {
        entry.debit = entry.debit.plus(line.amount);
      } else {
        entry.credit = entry.credit.plus(line.amount);
      }

      balances.set(line.ledgerAccountId, entry);
    }

    return {
      orgId,
      period: { from: from ?? null, to: to ?? null },
      accounts: [...balances.values()].map((b) => ({
        ledgerAccount: b.account,
        totalDebit: b.debit,
        totalCredit: b.credit,
        netBalance: b.debit.minus(b.credit),
      })),
    };
  }

  private buildTree<T extends { id: string; parentId: string | null; code: string }>(
    items: T[],
  ): (T & { children: T[] })[] {
    const map = new Map<string, T & { children: T[] }>();
    const roots: (T & { children: T[] })[] = [];

    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of map.values()) {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(item);
      } else {
        roots.push(item);
      }
    }

    return roots;
  }
}
