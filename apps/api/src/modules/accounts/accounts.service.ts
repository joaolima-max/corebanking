import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
type InputJsonValue = Prisma.InputJsonValue;
import { PrismaService } from '../../database/prisma.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { orgId?: string; type?: string; status?: string; page?: number; limit?: number }) {
    const { orgId, type, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(orgId ? { orgId } : {}),
      ...(type ? { type: type as never } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        include: { balance: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findById(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { balance: true, org: { select: { id: true, name: true, slug: true } } },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async create(dto: CreateAccountDto, actor: AuthUser) {
    const org = await this.prisma.organization.findUnique({ where: { id: dto.orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    if (dto.parentId) {
      const parent = await this.prisma.account.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent account not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          orgId: dto.orgId,
          type: dto.type,
          name: dto.name,
          description: dto.description,
          currency: dto.currency ?? 'BRL',
          parentId: dto.parentId ?? null,
          status: 'ACTIVE',
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      await tx.accountBalance.create({
        data: {
          accountId: account.id,
          availableAmount: new Prisma.Decimal(0),
          blockedAmount: new Prisma.Decimal(0),
          pendingAmount: new Prisma.Decimal(0),
          currency: dto.currency ?? 'BRL',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          orgId: dto.orgId,
          action: 'CREATE',
          resourceType: 'Account',
          resourceId: account.id,
          newValue: { type: dto.type, name: dto.name } as InputJsonValue,
        },
      });

      return account;
    });
  }

  async update(id: string, dto: { name?: string; description?: string }, actor: AuthUser) {
    await this.findById(id);
    const updated = await this.prisma.account.update({ where: { id }, data: dto });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: updated.orgId,
        action: 'UPDATE',
        resourceType: 'Account',
        resourceId: id,
        newValue: dto as unknown as InputJsonValue,
      },
    });

    return updated;
  }

  async block(id: string, actor: AuthUser) {
    const account = await this.findById(id);
    if (account.status === 'BLOCKED') throw new ConflictException('Account already blocked');

    await this.prisma.account.update({ where: { id }, data: { status: 'BLOCKED' } });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: account.orgId,
        action: 'ACCOUNT_BLOCK',
        resourceType: 'Account',
        resourceId: id,
      },
    });
  }

  async unblock(id: string, actor: AuthUser) {
    const account = await this.findById(id);
    if (account.status !== 'BLOCKED') throw new ConflictException('Account is not blocked');

    await this.prisma.account.update({ where: { id }, data: { status: 'ACTIVE' } });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: account.orgId,
        action: 'UPDATE',
        resourceType: 'Account',
        resourceId: id,
        newValue: { status: 'ACTIVE' },
      },
    });
  }

  async getBalance(id: string) {
    const balance = await this.prisma.accountBalance.findUnique({ where: { accountId: id } });
    if (!balance) throw new NotFoundException('Account balance not found');
    return balance;
  }

  async getChildren(id: string) {
    await this.findById(id);
    return this.prisma.account.findMany({
      where: { parentId: id },
      include: { balance: true },
    });
  }
}
