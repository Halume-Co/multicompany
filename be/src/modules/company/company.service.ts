import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { normalizeEmail } from '../auth/auth.utils';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new company and associate the seller user with it.
   */
  async register(dto: CreateCompanyDto, user: AuthenticatedUser) {
    const normalizedEmail = normalizeEmail(dto.email);
    const trimmedName = dto.name.trim();

    if (user.companyId) {
      throw new ConflictException(
        'Your account is already associated with a company',
      );
    }

    const existingByName = await this.prisma.company.findUnique({
      where: { name: trimmedName },
    });
    if (existingByName) {
      throw new ConflictException(
        `A company with name "${trimmedName}" already exists`,
      );
    }

    const existingByEmail = await this.prisma.company.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingByEmail) {
      throw new ConflictException(
        `A company with email "${normalizedEmail}" already exists`,
      );
    }

    const company = await this.prisma.company.create({
      data: {
        id: crypto.randomUUID(), // Explicitly set ID for schema name consistency
        name: trimmedName,
        description: dto.description?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
        email: normalizedEmail,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        dbSchema: `tenant_${crypto.randomUUID().replace(/-/g, '_')}`,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id },
    });

    return company;
  }

  async update(dto: UpdateCompanyDto, user: AuthenticatedUser) {
    if (!user.companyId) {
      throw new NotFoundException('No company associated with your account');
    }

    const existing = await this.prisma.company.findUnique({
      where: { id: user.companyId },
    });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.email && { email: normalizeEmail(dto.email) }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
      },
    });
  }

  async getMyCompany(user: AuthenticatedUser) {
    if (!user.companyId) {
      throw new NotFoundException('Not associated with a company.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!company) throw new NotFoundException('Company not found');

    return {
        ...company,
        _count: {
            ...company._count,
            products: 0, // In Silo architecture, we fetch this from the tenant schema
            orders: 0,
        }
    };
  }

  async findAll() {
    return this.prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        phone: true,
        address: true,
      },
    });

    if (!company) throw new NotFoundException(`Company not found`);

    return {
        ...company,
        _count: { products: 0 } // Fetched from tenant schema in storefront page
    };
  }
}
