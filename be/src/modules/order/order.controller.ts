import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SellerGuard } from '../../common/guards/seller.guard';

@Controller()
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * POST /checkout
   * Buyer: checkout cart → creates split orders per company.
   */
  @Post('checkout')
  checkout(
    @Body() dto: CheckoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orderService.checkout(dto, user);
  }

  /**
   * GET /orders
   * Buyer: list all their orders (across all companies).
   */
  @Get('orders')
  getBuyerOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.orderService.getBuyerOrders(user);
  }

  /**
   * GET /orders/:id
   * Buyer or Seller: get a specific order detail.
   */
  @Get('orders/:id')
  getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orderService.getOrderById(id, user);
  }

  /**
   * GET /seller/orders
   * Seller: list all orders belonging to their company.
   */
  @Get('seller/orders')
  @UseGuards(SellerGuard)
  getSellerOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.orderService.getSellerOrders(user);
  }
}
