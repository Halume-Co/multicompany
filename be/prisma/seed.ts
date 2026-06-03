import * as dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword, normalizeEmail } from '../src/modules/auth/auth.utils';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function createTenantSchema(companyId: string) {
    const schemaName = `tenant_${companyId.replace(/-/g, '_')}`;
    console.log(`🔨 Initializing silo for ${companyId} (Schema: ${schemaName})...`);
    
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // Create tables in the tenant schema
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${schemaName}"."categories" (id UUID PRIMARY KEY, name TEXT UNIQUE, slug TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${schemaName}"."products" (id UUID PRIMARY KEY, name TEXT, description TEXT, price DECIMAL(12,2), "imageUrl" TEXT, "isActive" BOOLEAN DEFAULT TRUE, "categoryId" UUID REFERENCES "${schemaName}"."categories"(id), "companyId" UUID, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${schemaName}"."product_sizes" (id UUID PRIMARY KEY, size INT, stock INT DEFAULT 0, "productId" UUID REFERENCES "${schemaName}"."products"(id) ON DELETE CASCADE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE("productId", size))`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${schemaName}"."orders" (id UUID PRIMARY KEY, "totalPrice" DECIMAL(12,2), status TEXT, notes TEXT, "userId" UUID, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${schemaName}"."order_items" (id UUID PRIMARY KEY, size INT, quantity INT, "unitPrice" DECIMAL(12,2), "orderId" UUID REFERENCES "${schemaName}"."orders"(id) ON DELETE CASCADE, "productId" UUID REFERENCES "${schemaName}"."products"(id), "createdAt" TIMESTAMP DEFAULT NOW())`);

    return schemaName;
}

async function main() {
  console.log('🚀 Starting Federated Silo Seeding...');

  // 0. Cleanup
  console.log('🧹 Cleaning up old data...');
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Setup Main Companies (Registry)
  const companies = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'Nike', email: 'seller@nike.example.com', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&h=100&q=80' },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Adidas', email: 'seller@adidas.example.com', logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=100&h=100&q=80' },
    { id: 'c35628e2-ac6f-4f8a-b866-bc293550d591', name: 'Puma', email: 'seller@puma.example.com', logo: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=100&h=100&q=80' },
  ];

  const catsToSeed = [
    { id: randomUUID(), name: 'Running', slug: 'running' },
    { id: randomUUID(), name: 'Casual', slug: 'casual' },
    { id: randomUUID(), name: 'Basketball', slug: 'basketball' },
  ];

  for (const c of companies) {
    await prisma.company.upsert({
      where: { id: c.id },
      update: { dbSchema: `tenant_${c.id.replace(/-/g, '_')}` },
      create: { 
        id: c.id, 
        name: c.name, 
        email: normalizeEmail(c.email), 
        logoUrl: c.logo, 
        dbSchema: `tenant_${c.id.replace(/-/g, '_')}` 
      },
    });

    // Initialize the isolated silo for this company
    const schema = await createTenantSchema(c.id);

    // Seed data into the SILO (isolated)
    for (const cat of catsToSeed) {
        await prisma.$executeRawUnsafe(`INSERT INTO "${schema}"."categories" (id, name, slug) VALUES ('${cat.id}', '${cat.name}', '${cat.slug}') ON CONFLICT DO NOTHING`);
    }

    // Seed some products into this silo
    const pId = randomUUID();
    await prisma.$executeRawUnsafe(`INSERT INTO "${schema}"."products" (id, name, price, "categoryId", "companyId") VALUES ('${pId}', '${c.name} Performance Shoe', 1200000, '${catsToSeed[0].id}', '${c.id}') ON CONFLICT DO NOTHING`);
    await prisma.$executeRawUnsafe(`INSERT INTO "${schema}"."product_sizes" (id, size, stock, "productId") VALUES ('${randomUUID()}', 42, 50, '${pId}') ON CONFLICT DO NOTHING`);
  }

  console.log('✅ Federated Silo Seeding completed!');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
