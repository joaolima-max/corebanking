import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
type InputJsonValue = Prisma.InputJsonValue;
import { CreateOrganizationDto } from './dtos/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { type?: string; parentId?: string; status?: string }) {
    return this.prisma.organization.findMany({
      where: {
        ...(params.type ? { type: params.type as never } : {}),
        ...(params.parentId ? { parentId: params.parentId } : {}),
        ...(params.status ? { status: params.status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async create(dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Organization slug already exists');

    if (dto.parentId) {
      const parent = await this.prisma.organization.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent organization not found');
    }

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        parentId: dto.parentId ?? null,
        status: 'ACTIVE',
        settings: (dto.settings ?? {}) as InputJsonValue,
      },
    });
  }

  async update(id: string, dto: Partial<CreateOrganizationDto>) {
    await this.findById(id);
    const { name, slug, type } = dto;
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(dto.settings !== undefined ? { settings: dto.settings as InputJsonValue } : {}),
      },
    });
  }

  async getChildren(id: string) {
    await this.findById(id);
    return this.prisma.organization.findMany({ where: { parentId: id }, orderBy: { name: 'asc' } });
  }

  async getAccounts(id: string) {
    await this.findById(id);
    return this.prisma.account.findMany({
      where: { orgId: id },
      include: { balance: true },
    });
  }

  async getUsers(id: string, params: { page?: number; limit?: number }) {
    await this.findById(id);
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { orgId: id },
        skip,
        take: limit,
        select: { id: true, email: true, fullName: true, status: true, createdAt: true },
      }),
      this.prisma.user.count({ where: { orgId: id } }),
    ]);

    return { data, meta: { total, page, limit } };
  }
}
