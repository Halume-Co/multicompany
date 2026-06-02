import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { SellerGuard } from '../../common/guards/seller.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * GET /products?categoryId=&companyId=&search=
   * Public — list all active products with optional filters.
   */
  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  /**
   * GET /products/:id
   * Public — get a single product.
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  /**
   * POST /products
   * Seller only — create a new product.
   */
  @Post()
  @UseGuards(SellerGuard)
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productService.create(dto, user);
  }

  /**
   * PUT /products/:id
   * Seller only — update a product (must own it).
   */
  @Put(':id')
  @UseGuards(SellerGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productService.update(id, dto, user);
  }

  /**
   * DELETE /products/:id
   * Seller only — soft-delete a product (must own it).
   */
  @Delete(':id')
  @UseGuards(SellerGuard)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productService.remove(id, user);
  }
}
