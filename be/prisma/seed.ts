import * as dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword, normalizeEmail } from '../src/modules/auth/auth.utils';

// Helper to create a prisma client for a specific URL using the PG Adapter
function createClientForUrl(url: string) {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter } as any);
}

async function main() {
  console.log('🚀 Starting Multi-Database Federated Seeding (Syncing Enums)...');

  const registryPrisma = createClientForUrl(process.env.DATABASE_URL!);
  const testPassword = "Password123!";
  const hashedPassword = await hashPassword(testPassword);

  // 0. Cleanup Registry
  console.log('🧹 Cleaning up Registry (Main DB)...');
  try {
    await registryPrisma.$executeRawUnsafe(`TRUNCATE TABLE "order_items", "orders", "cart_items", "carts", "sessions", "product_sizes", "products", "categories", "users", "companies" CASCADE`);
  } catch (e) {
    console.warn('⚠️ Registry cleanup failed.');
  }

  // 1. Global Categories
  console.log('📂 Seeding Global Categories...');
  const catData = [
    { name: 'Running', slug: 'running' },
    { name: 'Casual', slug: 'casual' },
    { name: 'Basketball', slug: 'basketball' },
    { name: 'Formal', slug: 'formal' },
  ];
  
  const globalCats: any[] = [];
  for (const cat of catData) {
      const c = await (registryPrisma as any).category.create({ data: cat });
      globalCats.push(c);
  }

  // 2. Global Users
  console.log('👤 Seeding Global Users...');
  await (registryPrisma as any).user.create({ data: { email: normalizeEmail('buyer@example.com'), name: 'Test Buyer', password: hashedPassword, role: 'BUYER' } });
  await (registryPrisma as any).user.create({ data: { email: normalizeEmail('admin@example.com'), name: 'Global Admin', password: hashedPassword, role: 'ADMIN' } });

  // 3. Companies Configuration
  const companies = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'Nike', email: 'seller@nike.example.com', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&h=100&q=80', url: process.env.DATABASE_NIKE },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Adidas', email: 'seller@adidas.example.com', logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=100&h=100&q=80', url: process.env.DATABASE_ADIDAS },
    { id: 'c35628e2-ac6f-4f8a-b866-bc293550d591', name: 'Puma', email: 'seller@puma.example.com', logo: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=100&h=100&q=80', url: process.env.DATABASE_PUMA },
  ];

  // 4. Seed Each Silo
  for (const c of companies) {
    if (!c.url) {
        console.warn(`⚠️ Skipping ${c.name} - No DATABASE_NIKE/ADIDAS/PUMA found in .env`);
        continue;
    }

    console.log(`\n🏢 Seeding Silo and Seller for: ${c.name}...`);
    
    await (registryPrisma as any).company.create({ data: { id: c.id, name: c.name, email: normalizeEmail(c.email), logoUrl: c.logo, isActive: true } });
    await (registryPrisma as any).user.create({ data: { email: normalizeEmail(c.email), name: `${c.name} Seller`, password: hashedPassword, role: 'SELLER', companyId: c.id } });

    const siloPrisma = createClientForUrl(c.url);

    try {
        // CLEANUP SILO
        await siloPrisma.$executeRawUnsafe(`TRUNCATE TABLE "order_items", "orders", "product_sizes", "products", "categories" CASCADE`).catch(() => {});

        // ENSURE ENUM TYPES EXIST IN SILO
        console.log(`   Ensuring Enum Types in ${c.name} silo...`);
        await siloPrisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await siloPrisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);

        // Ensure Silo Tables structure
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "categories" (id UUID PRIMARY KEY, name TEXT UNIQUE, slug TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "products" (id UUID PRIMARY KEY, name TEXT, description TEXT, price DECIMAL(12,2), "imageUrl" TEXT, "isActive" BOOLEAN DEFAULT TRUE, "categoryId" UUID REFERENCES "categories"(id), "companyId" UUID, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "product_sizes" (id UUID PRIMARY KEY, size INT, stock INT DEFAULT 0, "productId" UUID REFERENCES "products"(id) ON DELETE CASCADE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE("productId", size))`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "orders" (id UUID PRIMARY KEY, "totalPrice" DECIMAL(12,2), status "OrderStatus" DEFAULT 'PENDING', notes TEXT, "userId" UUID, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "order_items" (id UUID PRIMARY KEY, size INT, quantity INT, "unitPrice" DECIMAL(12,2), "orderId" UUID REFERENCES "orders"(id) ON DELETE CASCADE, "productId" UUID REFERENCES "products"(id), "createdAt" TIMESTAMP DEFAULT NOW())`);

        // SYNC ALL CATEGORIES TO THIS SILO
        console.log(`   Syncing ${globalCats.length} categories to ${c.name} silo...`);
        for (const gCat of globalCats) {
            await (siloPrisma as any).category.create({
                data: { id: gCat.id, name: gCat.name, slug: gCat.slug }
            });
        }

        // Seed Silo Products
        const products = [
            { name: `${c.name} Alpha`, price: 1200000, img: c.logo, catId: globalCats[0].id },
            { name: `${c.name} Beta`, price: 1500000, img: c.logo, catId: globalCats[1].id },
            { name: `${c.name} Gamma`, price: 900000, img: c.logo, catId: globalCats[2].id },
        ];

        for (const p of products) {
            const pId = randomUUID();
            const siloProduct = await (siloPrisma as any).product.create({
                data: {
                    id: pId,
                    name: p.name,
                    description: `High performance ${p.name} from ${c.name} isolated database.`,
                    price: p.price,
                    imageUrl: p.img,
                    categoryId: p.catId,
                    companyId: c.id,
                    sizes: { create: [{ size: 40, stock: 100 }, { size: 42, stock: 100 }] }
                }
            });

            await (registryPrisma as any).product.create({
                data: {
                    id: siloProduct.id,
                    name: siloProduct.name,
                    price: siloProduct.price,
                    imageUrl: siloProduct.imageUrl,
                    categoryId: p.catId,
                    companyId: c.id,
                }
            });
        }
        console.log(`✅ ${c.name} silo and seller seeded successfully.`);
    } catch (err) {
        console.error(`❌ Failed to seed silo for ${c.name}:`, err.message);
    } finally {
        await siloPrisma.$disconnect();
    }
  }

  console.log('\n✨ ALL DATABASES SYNCHRONIZED AND ENUMS FIXED! ✨');
  await registryPrisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal Seed Error:', e);
  process.exit(1);
});
