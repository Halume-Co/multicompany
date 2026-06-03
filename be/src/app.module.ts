import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { SessionAuthMiddleware } from './common/middleware/session-auth.middleware';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SellerGuard } from './common/guards/seller.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Load .env file globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Prisma (global, provides PrismaService everywhere)
    PrismaModule,

    // Multi-tenant Dynamic DB Router
    TenantModule,

    // Feature modules
    AuthModule,
    CompanyModule,
    ProductModule,
    CartModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SessionAuthMiddleware,
    AuthGuard,
    RolesGuard,
    SellerGuard,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Attach the authenticated user to req.user when a valid session exists.
    consumer
      .apply(SessionAuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
