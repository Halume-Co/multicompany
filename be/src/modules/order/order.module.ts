import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [CartModule],   // Import CartModule to use CartService (for checkout)
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
