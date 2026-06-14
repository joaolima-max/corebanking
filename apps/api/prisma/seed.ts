import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

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
  { resource: 'ledger', action: 'post', scopeType: 'own_org' },
  { resource: 'ledger', action: 'read', scopeType: 'own_org' },
  { resource: 'ledger', action: 'void', scopeType: 'own_org' },
  { resource: 'ledger', action: 'trial_balance', scopeType: 'own_org' },
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

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Bass Pago root organization
  const bassOrg = await prisma.organization.upsert({
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
  console.log(`✅ Organization: ${bassOrg.name} (${bassOrg.id})`);

  // 2. Create system permissions
  const permissionMap = new Map<string, string>();
  for (const perm of SYSTEM_PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { resource_action_scopeType: { resource: perm.resource, action: perm.action, scopeType: perm.scopeType } },
      update: {},
      create: perm,
    });
    permissionMap.set(`${perm.resource}:${perm.action}:${perm.scopeType}`, created.id);
  }
  console.log(`✅ Permissions: ${permissionMap.size} created`);

  // 3. Create system roles
  const roleMap = new Map<string, string>();
  for (const role of SYSTEM_ROLES) {
    const existing = await prisma.role.findFirst({ where: { slug: role.slug } });
    let created;
    if (existing) {
      created = existing;
    } else {
      created = await prisma.role.create({ data: { ...role, isSystem: true, orgId: null } });
    }
    roleMap.set(role.slug, created.id);
  }
  console.log(`✅ Roles: ${roleMap.size} created`);

  // 4. Assign all permissions to SUPER_ADMIN role
  const superAdminRoleId = roleMap.get('SUPER_ADMIN')!;
  for (const permId of permissionMap.values()) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRoleId, permissionId: permId } },
      update: {},
      create: { roleId: superAdminRoleId, permissionId: permId },
    });
  }
  console.log(`✅ SUPER_ADMIN permissions assigned`);

  // 5. Create admin user
  const passwordHash = await argon2.hash('Admin@123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@basspago.com.br' },
    update: {},
    create: {
      email: 'admin@basspago.com.br',
      fullName: 'Bass Admin',
      passwordHash,
      orgId: bassOrg.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Admin user: ${adminUser.email} (${adminUser.id})`);

  // 6. Assign SUPER_ADMIN role to admin user
  await prisma.userRole.upsert({
    where: { userId_roleId_orgId: { userId: adminUser.id, roleId: superAdminRoleId, orgId: bassOrg.id } },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRoleId,
      orgId: bassOrg.id,
      grantedBy: adminUser.id,
    },
  });
  console.log(`✅ SUPER_ADMIN role assigned to admin`);

  // 7. Create chart of accounts for Bass Pago
  const ledgerAccountMap = new Map<string, string>();
  for (const account of CHART_OF_ACCOUNTS) {
    const created = await prisma.ledgerAccount.upsert({
      where: { orgId_code: { orgId: bassOrg.id, code: account.code } },
      update: {},
      create: {
        orgId: bassOrg.id,
        code: account.code,
        name: account.name,
        type: account.type,
        currency: 'BRL',
        isActive: true,
      },
    });
    ledgerAccountMap.set(account.code, created.id);
  }
  console.log(`✅ Chart of accounts: ${ledgerAccountMap.size} accounts`);

  // 8. Create operational accounts
  const operationalAccounts = [
    { type: 'OPERATIONAL' as const, name: 'Conta Operacional Bass Pago' },
    { type: 'RESERVE' as const, name: 'Conta Reserva Bass Pago' },
    { type: 'SETTLEMENT' as const, name: 'Conta Liquidação Bass Pago' },
  ];

  const { Prisma } = await import('@prisma/client');
  for (const acc of operationalAccounts) {
    const existing = await prisma.account.findFirst({ where: { orgId: bassOrg.id, type: acc.type } });
    if (!existing) {
      const created = await prisma.account.create({
        data: {
          orgId: bassOrg.id,
          type: acc.type,
          name: acc.name,
          status: 'ACTIVE',
          currency: 'BRL',
        },
      });
      await prisma.accountBalance.create({
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
  console.log(`✅ Operational accounts created`);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📧 Admin credentials:`);
  console.log(`   Email:    admin@basspago.com.br`);
  console.log(`   Password: Admin@123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
