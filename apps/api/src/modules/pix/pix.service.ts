import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Prisma, PixKeyType } from '@prisma/client';
import { CreatePixKeyDto } from './dtos/create-pix-key.dto';
import { CreatePixTransferDto } from './dtos/create-pix-transfer.dto';
import { CreatePixQrCodeDto } from './dtos/create-pix-qr-code.dto';
import { validatePixKey } from './utils/pix-validators';
import { generateE2eId } from './utils/e2e-id';
import { generatePixQrCode } from './utils/emv-qrcode';
import { randomUUID } from 'crypto';

@Injectable()
export class PixService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PIX Keys ─────────────────────────────────────────────────────────────

  async registerKey(dto: CreatePixKeyDto, actor: AuthUser) {
    const { valid, error, normalized } = validatePixKey(dto.keyType, dto.keyValue);
    if (!valid) throw new BadRequestException(error);

    const keyValue = normalized ?? dto.keyValue;

    // If EVP, generate a UUID
    const finalKeyValue = dto.keyType === 'EVP' ? randomUUID() : keyValue;

    const existing = await this.prisma.pixKey.findFirst({
      where: { keyType: dto.keyType, keyValue: finalKeyValue, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictException('Esta chave PIX já está cadastrada');

    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, orgId: actor.orgId, status: 'ACTIVE' },
    });
    if (!account) throw new NotFoundException('Conta não encontrada ou inativa');

    return this.prisma.pixKey.create({
      data: {
        orgId: actor.orgId,
        accountId: dto.accountId,
        keyType: dto.keyType,
        keyValue: finalKeyValue,
        status: 'ACTIVE',
      },
    });
  }

  async listKeys(accountId: string | undefined, actor: AuthUser) {
    return this.prisma.pixKey.findMany({
      where: {
        orgId: actor.orgId,
        ...(accountId ? { accountId } : {}),
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteKey(id: string, actor: AuthUser) {
    const key = await this.prisma.pixKey.findFirst({
      where: { id, orgId: actor.orgId, status: 'ACTIVE' },
    });
    if (!key) throw new NotFoundException('Chave PIX não encontrada');

    return this.prisma.pixKey.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async lookupKey(keyType: string, keyValue: string) {
    const key = await this.prisma.pixKey.findFirst({
      where: { keyType: keyType as PixKeyType, keyValue, status: 'ACTIVE' },
      include: {
        account: { select: { id: true, name: true, type: true } },
        org: { select: { id: true, name: true } },
      },
    });
    if (!key) throw new NotFoundException('Chave PIX não encontrada');
    return {
      keyType: key.keyType,
      keyValue: key.keyValue,
      accountId: key.accountId,
      accountName: key.account.name,
      orgName: key.org.name,
    };
  }

  // ─── PIX Transfers ────────────────────────────────────────────────────────

  async initiateTransfer(dto: CreatePixTransferDto, actor: AuthUser, ipAddress: string) {
    void ipAddress; // reserved for audit logging
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lte(0)) throw new BadRequestException('Valor deve ser maior que zero');

    // Check sender account
    const senderAccount = await this.prisma.account.findFirst({
      where: { id: dto.senderAccountId, orgId: actor.orgId, status: 'ACTIVE' },
    });
    if (!senderAccount) throw new NotFoundException('Conta remetente não encontrada');

    // Check balance
    const balance = await this.prisma.accountBalance.findUnique({
      where: { accountId: dto.senderAccountId },
    });
    if (!balance || new Prisma.Decimal(balance.availableAmount).lt(amount)) {
      throw new UnprocessableEntityException('Saldo insuficiente');
    }

    // Lookup receiver key
    const receiverKey = await this.prisma.pixKey.findFirst({
      where: { keyType: dto.pixKeyType, keyValue: dto.pixKey, status: 'ACTIVE' },
    });

    const e2eId = generateE2eId();
    const idempotencyKey = dto.idempotencyKey ?? randomUUID();

    // Existing idempotency check
    const existingTransfer = await this.prisma.pixTransfer.findFirst({
      where: { e2eId },
    });
    if (existingTransfer) return existingTransfer;

    // Process as internal transfer if receiver key found
    let journalEntryId: string | undefined;
    let status: 'COMPLETED' | 'PENDING' = 'PENDING';

    if (receiverKey) {
      // Internal transfer — post journal entry
      const je = await this.prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.create({
          data: {
            orgId: actor.orgId,
            status: 'POSTED',
            description: dto.description ?? `PIX para ${dto.pixKey}`,
            referenceId: e2eId,
            referenceType: 'PIX',
            idempotencyKey,
            createdBy: actor.id,
            postedAt: new Date(),
            lines: {
              create: [
                {
                  ledgerAccountId: await this.getOrCreateLedgerAccount(tx, actor.orgId, 'ASSET', 'PIX-OUT', 'PIX Saídas'),
                  direction: 'DEBIT',
                  amount,
                  currency: 'BRL',
                  description: `PIX enviado - ${dto.pixKey}`,
                },
                {
                  ledgerAccountId: await this.getOrCreateLedgerAccount(tx, actor.orgId, 'LIABILITY', 'PIX-IN', 'PIX Entradas'),
                  direction: 'CREDIT',
                  amount,
                  currency: 'BRL',
                  description: `PIX recebido - ${dto.pixKey}`,
                },
              ],
            },
          },
        });

        // Update sender balance
        await tx.accountBalance.update({
          where: { accountId: dto.senderAccountId },
          data: { availableAmount: { decrement: amount } },
        });

        // Update receiver balance
        await tx.accountBalance.update({
          where: { accountId: receiverKey.accountId },
          data: { availableAmount: { increment: amount } },
        });

        return entry;
      });

      journalEntryId = je.id;
      status = 'COMPLETED';
    }

    return this.prisma.pixTransfer.create({
      data: {
        orgId: actor.orgId,
        senderAccountId: dto.senderAccountId,
        receiverAccountId: receiverKey?.accountId,
        amount,
        currency: 'BRL',
        status,
        e2eId,
        pixKey: dto.pixKey,
        pixKeyType: dto.pixKeyType,
        description: dto.description,
        journalEntryId,
      },
    });
  }

  async listTransfers(accountId: string | undefined, actor: AuthUser) {
    return this.prisma.pixTransfer.findMany({
      where: {
        orgId: actor.orgId,
        ...(accountId
          ? { OR: [{ senderAccountId: accountId }, { receiverAccountId: accountId }] }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getTransfer(id: string, actor: AuthUser) {
    const transfer = await this.prisma.pixTransfer.findFirst({
      where: { id, orgId: actor.orgId },
    });
    if (!transfer) throw new NotFoundException('Transferência não encontrada');
    return transfer;
  }

  // ─── PIX QR Codes ─────────────────────────────────────────────────────────

  async createQrCode(dto: CreatePixQrCodeDto, actor: AuthUser) {
    const pixKey = await this.prisma.pixKey.findFirst({
      where: { id: dto.pixKeyId, accountId: dto.accountId, orgId: actor.orgId, status: 'ACTIVE' },
      include: { account: true, org: true },
    });
    if (!pixKey) throw new NotFoundException('Chave PIX não encontrada');

    const txId = randomUUID().replace(/-/g, '').substring(0, 25);
    const expiresAt = dto.type === 'DYNAMIC' && dto.expiresInMinutes
      ? new Date(Date.now() + (dto.expiresInMinutes as number) * 60_000)
      : undefined;

    const payload = generatePixQrCode({
      pixKey: pixKey.keyValue,
      merchantName: pixKey.org.name.substring(0, 25),
      merchantCity: 'SAO PAULO',
      amount: dto.amount,
      txId,
      description: dto.description,
      isStatic: dto.type === 'STATIC',
    });

    return this.prisma.pixQrCode.create({
      data: {
        orgId: actor.orgId,
        accountId: dto.accountId,
        pixKeyId: dto.pixKeyId,
        type: dto.type,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        description: dto.description,
        payload,
        txId,
        status: 'ACTIVE',
        expiresAt,
      },
    });
  }

  async listQrCodes(accountId: string | undefined, actor: AuthUser) {
    return this.prisma.pixQrCode.findMany({
      where: {
        orgId: actor.orgId,
        ...(accountId ? { accountId } : {}),
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(actor: AuthUser) {
    const [keysCount, transfersIn, transfersOut, qrCodesCount] = await Promise.all([
      this.prisma.pixKey.count({ where: { orgId: actor.orgId, status: 'ACTIVE' } }),
      this.prisma.pixTransfer.aggregate({
        where: { orgId: actor.orgId, receiverAccountId: { not: null }, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.pixTransfer.aggregate({
        where: { orgId: actor.orgId, status: { in: ['COMPLETED', 'PENDING'] } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.pixQrCode.count({ where: { orgId: actor.orgId, status: 'ACTIVE' } }),
    ]);

    return {
      keysCount,
      qrCodesCount,
      pixIn: { count: transfersIn._count, total: transfersIn._sum.amount ?? 0 },
      pixOut: { count: transfersOut._count, total: transfersOut._sum.amount ?? 0 },
    };
  }

  // Helper: get or create ledger account by code
  private async getOrCreateLedgerAccount(
    tx: Prisma.TransactionClient,
    orgId: string,
    type: 'ASSET' | 'LIABILITY',
    code: string,
    name: string,
  ): Promise<string> {
    const existing = await tx.ledgerAccount.findUnique({ where: { orgId_code: { orgId, code } } });
    if (existing) return existing.id;
    const created = await tx.ledgerAccount.create({
      data: { orgId, code, name, type, currency: 'BRL', isActive: true },
    });
    return created.id;
  }
}
