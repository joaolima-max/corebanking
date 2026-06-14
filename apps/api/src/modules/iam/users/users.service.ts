import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
type InputJsonValue = Prisma.InputJsonValue;
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AssignRoleDto } from './dtos/assign-role.dto';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { orgId?: string; status?: string; page?: number; limit?: number }) {
    const { orgId, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(orgId ? { orgId } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, email: true, fullName: true, orgId: true,
          status: true, emailVerifiedAt: true, lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, orgId: true,
        status: true, emailVerifiedAt: true, lastLoginAt: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const orgId = dto.orgId ?? actor.orgId;
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const user = await this.prisma.user.create({
      data: { email: dto.email, fullName: dto.fullName, passwordHash, orgId, status: 'ACTIVE' },
      select: { id: true, email: true, fullName: true, orgId: true, status: true, createdAt: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId,
        action: 'CREATE',
        resourceType: 'User',
        resourceId: user.id,
        newValue: { email: user.email },
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    await this.findById(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, fullName: true, orgId: true, status: true, updatedAt: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: actor.orgId,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: id,
        newValue: dto as unknown as InputJsonValue,
      },
    });

    return updated;
  }

  async remove(id: string, actor: AuthUser) {
    await this.findById(id);
    if (id === actor.id) throw new ForbiddenException('Cannot delete yourself');

    await this.prisma.user.update({ where: { id }, data: { status: 'INACTIVE' } });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: actor.orgId,
        action: 'DELETE',
        resourceType: 'User',
        resourceId: id,
      },
    });
  }

  async block(id: string, actor: AuthUser) {
    const user = await this.findById(id);
    if (user.status === 'BLOCKED') throw new ConflictException('User already blocked');

    await this.prisma.user.update({ where: { id }, data: { status: 'BLOCKED' } });
    await this.prisma.session.updateMany({ where: { userId: id }, data: { revokedAt: new Date() } });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: actor.orgId,
        action: 'ACCOUNT_BLOCK',
        resourceType: 'User',
        resourceId: id,
      },
    });
  }

  async unblock(id: string, actor: AuthUser) {
    const user = await this.findById(id);
    if (user.status !== 'BLOCKED') throw new ConflictException('User is not blocked');

    await this.prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: actor.orgId,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: id,
        newValue: { status: 'ACTIVE' },
      },
    });
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  async assignRole(userId: string, dto: AssignRoleDto, actor: AuthUser) {
    await this.findById(userId);
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const orgId = dto.orgId ?? actor.orgId;

    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId: dto.roleId, orgId },
    });
    if (existing) throw new ConflictException('Role already assigned');

    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId: dto.roleId,
        orgId,
        grantedBy: actor.id,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: actor.orgId,
        action: 'PERMISSION_CHANGE',
        resourceType: 'UserRole',
        resourceId: userId,
        newValue: { roleId: dto.roleId },
      },
    });

    return userRole;
  }

  async removeRole(userId: string, roleId: string, actor: AuthUser) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });

    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        orgId: actor.orgId,
        action: 'PERMISSION_CHANGE',
        resourceType: 'UserRole',
        resourceId: userId,
        oldValue: { roleId },
      },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, ipAddress: true, deviceInfo: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
