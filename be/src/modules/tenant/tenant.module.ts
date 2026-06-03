import { Global, Injectable, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantConnectionService {
  constructor(private readonly prisma: PrismaService) {}

  getTenantClient(companyId: string) {
    const prisma = this.prisma;
    const schemaName = `tenant_${companyId.toString().replace(/-/g, '_')}`;
    return prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);
            return query(args);
          },
        },
      },
    });
  }
}

@Global()
@Module({
  providers: [
    TenantConnectionService,
    {
      provide: 'TENANT_PRISMA',
      scope: Scope.REQUEST,
      inject: [REQUEST, TenantConnectionService, PrismaService],
      useFactory: async (req: any, tcs: TenantConnectionService, prisma: PrismaService) => {
        const companyId = 
          req.headers['x-tenant-id'] || 
          req.query['companyId'] || 
          req.user?.companyId;

        if (!companyId) {
          return prisma;
        }

        return tcs.getTenantClient(companyId.toString());
      },
    },
  ],
  exports: ['TENANT_PRISMA', TenantConnectionService],
})
export class TenantModule {}
