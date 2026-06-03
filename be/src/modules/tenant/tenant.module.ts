import { Global, Injectable, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantConnectionService {
  private clients: Map<string, PrismaClient> = new Map();

  constructor(private readonly registryPrisma: PrismaService) {}

  async getTenantClient(companyId: string): Promise<PrismaClient> {
    // 1. Check cache first
    if (this.clients.has(companyId)) {
      return this.clients.get(companyId)!;
    }

    // 2. Map fixed demo IDs to env variables, or look up in registry
    let databaseUrl = process.env.DATABASE_URL; // Fallback

    if (companyId === '11111111-1111-4111-8111-111111111111') {
      databaseUrl = process.env.DATABASE_NIKE;
    } else if (companyId === '22222222-2222-4222-8222-222222222222') {
      databaseUrl = process.env.DATABASE_ADIDAS;
    } else if (companyId === 'c35628e2-ac6f-4f8a-b866-bc293550d591') {
      databaseUrl = process.env.DATABASE_PUMA;
    } else {
      // For dynamic/new companies, we would fetch the custom dbUrl from the registry
      const company = await this.registryPrisma.company.findUnique({ where: { id: companyId } });
      if (company?.dbSchema) {
          // If we are still using schema-based silo for others
          return this.registryPrisma.$extends({
            query: {
              $allModels: {
                async $allOperations({ args, query }) {
                  await (this as any).$executeRawUnsafe(`SET search_path TO "${company.dbSchema}", public`);
                  return query(args);
                },
              },
            },
          }) as any;
      }
    }

    if (!databaseUrl) {
        console.warn(`⚠️ No specific database URL found for company ${companyId}, using default.`);
        databaseUrl = process.env.DATABASE_URL;
    }

    // 3. Create a new client for this specific physical database
    const client = new PrismaClient({
      datasourceUrl: databaseUrl,
    });

    this.clients.set(companyId, client);
    return client;
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
