import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * GET /cart
   * Get the current user's cart.
   */
  @Get()
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.getCart(user);
  }

  /**
   * POST /cart/add
   * Add a product (with size + quantity) to the cart.
   */
  @Post('add')
  addToCart(
    @Body() dto: AddToCartDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.addToCart(dto, user);
  }

  /**
   * PATCH /cart/update
   * Update the quantity of a specific product+size in the cart.
   */
  @Patch('update')
  updateQuantity(
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.updateQuantity(dto, user);
  }

  /**
   * DELETE /cart/remove
   * Remove a specific product+size from the cart.
   */
  @Delete('remove')
  removeFromCart(
    @Body() dto: RemoveFromCartDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.removeFromCart(dto, user);
  }
}
