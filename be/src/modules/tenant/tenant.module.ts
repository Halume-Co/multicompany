import { Global, Injectable, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantConnectionService {
  private clients: Map<string, PrismaClient> = new Map();

  constructor(private readonly registryPrisma: PrismaService) {}

  async getTenantClient(companyId: string): Promise<PrismaClient> {
    if (this.clients.has(companyId)) {
      return this.clients.get(companyId)!;
    }

    const registryPrisma = this.registryPrisma;
    let databaseUrl = process.env.DATABASE_URL; 

    // Handle fixed demo IDs
    if (companyId === '11111111-1111-4111-8111-111111111111') {
      databaseUrl = process.env.DATABASE_NIKE;
    } else if (companyId === '22222222-2222-4222-8222-222222222222') {
      databaseUrl = process.env.DATABASE_ADIDAS;
    } else if (companyId === 'c35628e2-ac6f-4f8a-b866-bc293550d591') {
      databaseUrl = process.env.DATABASE_PUMA;
    } else {
      // For dynamic/new companies using schema-based silos in the registry DB
      const company = await registryPrisma.company.findUnique({ where: { id: companyId } });
      if (company?.dbSchema) {
          const schemaName = company.dbSchema;
          const extendedClient = registryPrisma.$extends({
            query: {
              $allModels: {
                async $allOperations({ args, query }) {
                  // Use registryPrisma directly to set path
                  await registryPrisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);
                  return query(args);
                },
              },
            },
          }) as any;
          this.clients.set(companyId, extendedClient);
          return extendedClient;
      }
    }

    if (!databaseUrl) {
        console.error(`❌ No database URL found for company ${companyId}`);
        return registryPrisma; // Final fallback
    }

    console.log(`🔌 Connecting to physical Silo DB for company ${companyId}...`);
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    const client = new PrismaClient({ adapter } as any);

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

        return await tcs.getTenantClient(companyId.toString());
      },
    },
  ],
  exports: ['TENANT_PRISMA', TenantConnectionService],
})
export class TenantModule {}
