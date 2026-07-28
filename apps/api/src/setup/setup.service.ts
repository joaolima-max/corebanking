import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';

const SYSTEM_ROLES = [
  { name: 'Super Admin', slug: 'SUPER_ADMIN', scope: 'GLOBAL' as const, description: 'Full platform access' },
  { name: 'Admin', slug: 'ADMIN', scope: 'ORGANIZATION' as const, description: 'Organization management' },
  { name: 'Operations', slug: 'OPERATIONS', scope: 'ORGANIZATION' as const, description: 'Operational monitoring' },
  { name: 'Treasury', slug: 'TREASURY', scope: 'ORGANIZATION' as const, description: 'Financial operations' },
  { name: 'Compliance', slug: 'COMPLIANCE', scope: 'ORGANIZATION' as const, description: 'KYC, PLD, COAF' },
  { name: 'Risk', slug: 'RISK', scope: 'ORGANIZATION' as const, description: 'Risk rules and scoring' },
  { name: 'Comercial', slug: 'COMERCIAL', scope: 'ORGANIZATION' as const, description: 'WL/merchant onboarding' },
  { name: 'Suporte', slug: 'SUPORTE', scope: 'ORGANIZATION' as const, description: 'Limited read access' },
  { name: 'WL Admin', slug: 'WL_ADMIN', scope: 'WHITE_LABEL' as const, description: 'White label administration' },
  { name: 'Merchant Admin', slug: 'MERCHANT_ADMIN', scope: 'MERCHANT' as const, description: 'Merchant administration' },
];

const SYSTEM_PERMISSIONS = [
  { resource: 'users', action: 'create', scopeType: 'own_org' },
  { resource: 'users', action: 'read', scopeType: 'own_org' },
  { resource: 'users', action: 'update', scopeType: 'own_org' },
  { resource: 'users', action: 'delete', scopeType: 'own_org' },
  { resource: 'users', action: 'block', scopeType: 'own_org' },
  { resource: 'roles', action: 'assign', scopeType: 'below_self' },
  { resource: 'roles', action: 'create', scopeType: 'own_org' },
  { resource: 'roles', action: 'read', scopeType: 'any' },
  { resource: 'organizations', action: 'create', scopeType: 'any' },
  { resource: 'organizations', action: 'read', scopeType: 'any' },
  { resource: 'organizations', action: 'update', scopeType: 'own' },
  { resource: 'accounts', action: 'create', scopeType: 'own_org' },
  { resource: 'accounts', action: 'read', scopeType: 'own_org' },
  { resource: 'accounts', action: 'block', scopeType: 'own_org' },
  { resource: 'accounts', action: 'update', scopeType: 'own_org' },
  { resource: 'ledger', action: 'post', scopeType: 'own_org' },
  { resource: 'ledger', action: 'read', scopeType: 'own_org' },
  { resource: 'ledger', action: 'void', scopeType: 'own_org' },
  { resource: 'ledger', action: 'trial_balance', scopeType: 'own_org' },
  { resource: 'dashboard', action: 'read', scopeType: 'own_org' },
];

const CHART_OF_ACCOUNTS = [
  { code: '1.1.1', name: 'Caixa e Equivalentes', type: 'ASSET' as const },
  { code: '1.1.2', name: 'Contas a Receber', type: 'ASSET' as const },
  { code: '1.2.1', name: 'Investimentos', type: 'ASSET' as const },
  { code: '2.1.1', name: 'Obrigações com Clientes', type: 'LIABILITY' as const },
  { code: '2.1.2', name: 'Tarifas a Pagar', type: 'LIABILITY' as const },
  { code: '3.1.1', name: 'Receita de Tarifas', type: 'REVENUE' as const },
  { code: '3.1.2', name: 'Receita de Antecipação', type: 'REVENUE' as const },
  { code: '4.1.1', name: 'Custo de Processamento', type: 'EXPENSE' as const },
  { code: '5.1.1', name: 'Capital', type: 'EQUITY' as const },
];

/**
 * Idempotent database seed, runnable over HTTP where `prisma db seed` cannot run
 * (e.g. serverless on Vercel). Mirrors prisma/seed.ts.
 */
@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<{ ok: true; org: string; adminEmail: string; roles: number; permissions: number; ledgerAccounts: number }> {
    const org = await this.prisma.organization.upsert({
      where: { slug: 'bass-pago' },
      update: {},
      create: {
        name: 'Bass Pago',
        slug: 'bass-pago',
        type: 'BASS',
        status: 'ACTIVE',
        settings: { country: 'BR', currency: 'BRL', timezone: 'America/Sao_Paulo' },
      },
    });

    const permissionIds: string[] = [];
    for (const perm of SYSTEM_PERMISSIONS) {
      const created = await this.prisma.permission.upsert({
        where: { resource_action_scopeType: { resource: perm.resource, action: perm.action, scopeType: perm.scopeType } },
        update: {},
        create: perm,
      });
      permissionIds.push(created.id);
    }

    const roleMap = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const existing = await this.prisma.role.findFirst({ where: { slug: role.slug } });
      const created = existing ?? (await this.prisma.role.create({ data: { ...role, isSystem: true, orgId: null } }));
      roleMap.set(role.slug, created.id);
    }

    const superAdminRoleId = roleMap.get('SUPER_ADMIN')!;
    for (const permissionId of permissionIds) {
      await this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRoleId, permissionId } },
        update: {},
        create: { roleId: superAdminRoleId, permissionId },
      });
    }

    const passwordHash = await argon2.hash('Admin@123!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const admin = await this.prisma.user.upsert({
      where: { email: 'admin@basspago.com.br' },
      update: {},
      create: {
        email: 'admin@basspago.com.br',
        fullName: 'Bass Admin',
        passwordHash,
        orgId: org.id,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    await this.prisma.userRole.upsert({
      where: { userId_roleId_orgId: { userId: admin.id, roleId: superAdminRoleId, orgId: org.id } },
      update: {},
      create: { userId: admin.id, roleId: superAdminRoleId, orgId: org.id, grantedBy: admin.id },
    });

    let ledgerCount = 0;
    for (const account of CHART_OF_ACCOUNTS) {
      await this.prisma.ledgerAccount.upsert({
        where: { orgId_code: { orgId: org.id, code: account.code } },
        update: {},
        create: { orgId: org.id, code: account.code, name: account.name, type: account.type, currency: 'BRL', isActive: true },
      });
      ledgerCount += 1;
    }

    const operationalAccounts = [
      { type: 'OPERATIONAL' as const, name: 'Conta Operacional Bass Pago' },
      { type: 'RESERVE' as const, name: 'Conta Reserva Bass Pago' },
      { type: 'SETTLEMENT' as const, name: 'Conta Liquidação Bass Pago' },
    ];
    for (const acc of operationalAccounts) {
      const existing = await this.prisma.account.findFirst({ where: { orgId: org.id, type: acc.type } });
      if (!existing) {
        const created = await this.prisma.account.create({
          data: { orgId: org.id, type: acc.type, name: acc.name, status: 'ACTIVE', currency: 'BRL' },
        });
        await this.prisma.accountBalance.create({
          data: {
            accountId: created.id,
            availableAmount: new Prisma.Decimal(0),
            blockedAmount: new Prisma.Decimal(0),
            pendingAmount: new Prisma.Decimal(0),
            currency: 'BRL',
          },
        });
      }
    }

    this.logger.log('Setup seed completed');
    return {
      ok: true,
      org: org.name,
      adminEmail: admin.email,
      roles: roleMap.size,
      permissions: permissionIds.length,
      ledgerAccounts: ledgerCount,
    };
  }
}
