import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SellerGuard } from '../../common/guards/seller.guard';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * POST /companies/register
   * Seller registers a new company (tenant).
   */
  @Post('register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  register(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.register(dto, user);
  }

  /**
   * PUT /companies/me
   * Seller updates their own company profile.
   */
  @Put('me')
  @UseGuards(SellerGuard)
  update(
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.update(dto, user);
  }

  /**
   * GET /companies/me

  /**
   * GET /companies
   * Public: list all active companies.
   */
  @Get()
  findAll() {
    return this.companyService.findAll();
  }

  /**
   * GET /companies/:id
   * Public: get single company.
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }
}
