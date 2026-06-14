import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRoleDto } from './dtos/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { scope?: string; orgId?: string }) {
    return this.prisma.role.findMany({
      where: {
        ...(params.scope ? { scope: params.scope as never } : {}),
        ...(params.orgId ? { orgId: params.orgId } : {}),
      },
      include: { _count: { select: { rolePermissions: true, userRoles: true } } },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Role slug already exists');

    return this.prisma.role.create({
      data: { ...dto, isSystem: false },
    });
  }

  async update(id: string, dto: Partial<CreateRoleDto>) {
    const role = await this.findById(id);
    if (role.isSystem) throw new ForbiddenException('Cannot modify system roles');

    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const role = await this.findById(id);
    if (role.isSystem) throw new ForbiddenException('Cannot delete system roles');

    await this.prisma.role.delete({ where: { id } });
  }

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role.rolePermissions.map((rp) => rp.permission);
  }

  async assignPermission(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const perm = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!perm) throw new NotFoundException('Permission not found');

    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (existing) throw new ConflictException('Permission already assigned to role');

    return this.prisma.rolePermission.create({ data: { roleId, permissionId } });
  }

  async removePermission(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }
}
