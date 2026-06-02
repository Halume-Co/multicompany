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

    // Check name uniqueness
    const existingByName = await this.prisma.company.findUnique({
      where: { name: trimmedName },
    });
    if (existingByName) {
      throw new ConflictException(
        `A company with name "${trimmedName}" already exists`,
      );
    }

    // Check email uniqueness
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
        name: trimmedName,
        description: dto.description?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
        email: normalizedEmail,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
      },
    });

    // Associate seller with the newly created company
    await this.prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id },
    });

    return company;
  }

  /**
   * Update the company profile for the authenticated seller.
   */
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

    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existingByName = await this.prisma.company.findFirst({
        where: { name: trimmedName, id: { not: user.companyId } },
      });
      if (existingByName) {
        throw new ConflictException(`Company name "${trimmedName}" is taken`);
      }
      dto.name = trimmedName;
    }

    if (dto.email) {
      const normalizedEmail = normalizeEmail(dto.email);
      const existingByEmail = await this.prisma.company.findFirst({
        where: { email: normalizedEmail, id: { not: user.companyId } },
      });
      if (existingByEmail) {
        throw new ConflictException(`Email "${normalizedEmail}" is already used by another company`);
      }
      dto.email = normalizedEmail;
    }

    return this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
      },
    });
  }

  /**
   * Get the company profile for the authenticated seller.
   */
  async getMyCompany(user: AuthenticatedUser) {
    if (!user.companyId) {
      throw new NotFoundException(
        'You are not associated with any company. Register one first.',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        _count: {
          select: { products: true, orders: true, users: true },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  /**
   * List all active companies (public endpoint).
   */
  async findAll() {
    return this.prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a specific company by id.
   */
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
        _count: { select: { products: true } },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }

    return company;
  }
}
