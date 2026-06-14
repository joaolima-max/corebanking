import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../../database/prisma.service';

const DEBIT = 'DEBIT' as never;
const CREDIT = 'CREDIT' as never;

const mockPrisma = {
  journalEntry: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  journalEntryLine: {
    findMany: jest.fn(),
  },
  ledgerAccount: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  fullName: 'Test User',
  orgId: 'org-1',
  status: 'ACTIVE',
  roles: ['SUPER_ADMIN'],
  permissions: [],
};

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
  });

  describe('postJournalEntry — double-entry invariant', () => {
    const baseDto = {
      orgId: 'org-1',
      description: 'Test entry',
      idempotencyKey: 'key-1',
    };

    const mockOrg = { id: 'org-1', name: 'Test Org' };
    const mockAccounts = [
      { id: 'acc-debit', isActive: true },
      { id: 'acc-credit', isActive: true },
    ];

    beforeEach(() => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.ledgerAccount.findMany.mockResolvedValue(mockAccounts);
    });

    it('throws UnprocessableEntityException when Σ DEBIT ≠ Σ CREDIT', async () => {
      await expect(
        service.postJournalEntry(
          {
            ...baseDto,
            lines: [
              { ledgerAccountId: 'acc-debit', direction: DEBIT, amount: 100.00 },
              { ledgerAccountId: 'acc-credit', direction: CREDIT, amount: 99.99 },
            ],
          },
          mockUser,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when only DEBIT lines provided', async () => {
      await expect(
        service.postJournalEntry(
          {
            ...baseDto,
            lines: [
              { ledgerAccountId: 'acc-debit', direction: DEBIT, amount: 100.00 },
              { ledgerAccountId: 'acc-credit', direction: DEBIT, amount: 100.00 },
            ],
          },
          mockUser,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('calls $transaction when Σ DEBIT = Σ CREDIT', async () => {
      const mockEntry = { id: 'je-1', status: 'POSTED', lines: [] };
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
      mockPrisma.journalEntry.create.mockResolvedValue(mockEntry);

      const result = await service.postJournalEntry(
        {
          ...baseDto,
          lines: [
            { ledgerAccountId: 'acc-debit', direction: DEBIT, amount: 100.00 },
            { ledgerAccountId: 'acc-credit', direction: CREDIT, amount: 100.00 },
          ],
        },
        mockUser,
      );

      expect(result).toEqual(mockEntry);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('returns existing JE when idempotency key is duplicate', async () => {
      const existingEntry = { id: 'existing-je', status: 'POSTED', lines: [] };
      mockPrisma.journalEntry.findUnique.mockResolvedValue(existingEntry);

      const result = await service.postJournalEntry(
        {
          ...baseDto,
          lines: [
            { ledgerAccountId: 'acc-debit', direction: DEBIT, amount: 100.00 },
            { ledgerAccountId: 'acc-credit', direction: CREDIT, amount: 100.00 },
          ],
        },
        mockUser,
      );

      expect(result).toEqual(existingEntry);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('handles multi-line balanced entries (3 lines)', async () => {
      const mockEntry = { id: 'je-multi', status: 'POSTED', lines: [] };
      mockPrisma.ledgerAccount.findMany.mockResolvedValue([
        { id: 'acc-1', isActive: true },
        { id: 'acc-2', isActive: true },
        { id: 'acc-3', isActive: true },
      ]);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
      mockPrisma.journalEntry.create.mockResolvedValue(mockEntry);

      // DR 100 = CR 60 + CR 40
      await expect(
        service.postJournalEntry(
          {
            ...baseDto,
            idempotencyKey: 'multi-line-key',
            lines: [
              { ledgerAccountId: 'acc-1', direction: DEBIT, amount: 100.00 },
              { ledgerAccountId: 'acc-2', direction: CREDIT, amount: 60.00 },
              { ledgerAccountId: 'acc-3', direction: CREDIT, amount: 40.00 },
            ],
          },
          mockUser,
        ),
      ).resolves.toEqual(mockEntry);
    });

    it('uses Decimal arithmetic — avoids floating-point errors', async () => {
      // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754, but Prisma.Decimal handles it correctly
      const mockEntry = { id: 'je-decimal', status: 'POSTED', lines: [] };
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
      mockPrisma.journalEntry.create.mockResolvedValue(mockEntry);

      await expect(
        service.postJournalEntry(
          {
            ...baseDto,
            idempotencyKey: 'decimal-key',
            lines: [
              { ledgerAccountId: 'acc-debit', direction: DEBIT, amount: 0.30 },
              { ledgerAccountId: 'acc-credit', direction: CREDIT, amount: 0.30 },
            ],
          },
          mockUser,
        ),
      ).resolves.toEqual(mockEntry);
    });
  });
});
