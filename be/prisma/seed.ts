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
  console.log('🚀 Starting Multi-Database Federated Seeding (Restoring Users)...');

  const registryPrisma = createClientForUrl(process.env.DATABASE_URL!);
  const testPassword = "Password123!";
  const hashedPassword = await hashPassword(testPassword);

  // 0. Cleanup Registry
  console.log('🧹 Cleaning up Registry (Main DB)...');
  try {
    // Order matters for FK constraints
    await registryPrisma.$executeRawUnsafe(`TRUNCATE TABLE "order_items", "orders", "cart_items", "carts", "sessions", "product_sizes", "products", "categories", "users", "companies" CASCADE`);
  } catch (e) {
    console.warn('⚠️ Standard truncate failed, trying individual deletes...');
    await registryPrisma.cartItem.deleteMany().catch(() => {});
    await registryPrisma.cart.deleteMany().catch(() => {});
    await registryPrisma.session.deleteMany().catch(() => {});
    await registryPrisma.user.deleteMany().catch(() => {});
    await registryPrisma.product.deleteMany().catch(() => {});
    await registryPrisma.category.deleteMany().catch(() => {});
    await registryPrisma.company.deleteMany().catch(() => {});
  }

  // 1. Companies Configuration
  const companies = [
    { 
        id: '11111111-1111-4111-8111-111111111111', 
        name: 'Nike', 
        email: 'seller@nike.example.com', 
        logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&h=100&q=80',
        url: process.env.DATABASE_NIKE 
    },
    { 
        id: '22222222-2222-4222-8222-222222222222', 
        name: 'Adidas', 
        email: 'seller@adidas.example.com', 
        logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=100&h=100&q=80',
        url: process.env.DATABASE_ADIDAS 
    },
    { 
        id: 'c35628e2-ac6f-4f8a-b866-bc293550d591', 
        name: 'Puma', 
        email: 'seller@puma.example.com', 
        logo: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=100&h=100&q=80',
        url: process.env.DATABASE_PUMA 
    },
  ];

  // 2. Global Categories (In Registry for Fast Filter)
  console.log('📂 Seeding Global Categories...');
  const runningCat = await registryPrisma.category.create({ data: { name: 'Running', slug: 'running' } });
  const casualCat = await registryPrisma.category.create({ data: { name: 'Casual', slug: 'casual' } });
  const bballCat = await registryPrisma.category.create({ data: { name: 'Basketball', slug: 'basketball' } });

  // 3. Global Users (In Registry)
  console.log('👤 Seeding Global Users...');
  
  // Test Buyer
  await registryPrisma.user.create({
    data: {
      email: normalizeEmail('buyer@example.com'),
      name: 'Test Buyer',
      password: hashedPassword,
      role: 'BUYER',
    }
  });

  // Admin
  await registryPrisma.user.create({
    data: {
      email: normalizeEmail('admin@example.com'),
      name: 'Global Admin',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  // 4. Seed Each Silo & Seller
  for (const c of companies) {
    if (!c.url) {
        console.warn(`⚠️ Skipping ${c.name} - No DATABASE_URL found in .env`);
        continue;
    }

    console.log(`\n🏢 Seeding Silo and Seller for: ${c.name}...`);
    
    // Create company in Registry
    await registryPrisma.company.create({
      data: {
        id: c.id,
        name: c.name,
        email: normalizeEmail(c.email),
        logoUrl: c.logo,
        isActive: true,
      },
    });

    // Create Seller for this company in Registry
    await registryPrisma.user.create({
        data: {
            email: normalizeEmail(c.email),
            name: `${c.name} Seller`,
            password: hashedPassword,
            role: 'SELLER',
            companyId: c.id,
        }
    });

    const siloPrisma = createClientForUrl(c.url);

    try {
        // Ensure tables exist in Silo
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "categories" (id UUID PRIMARY KEY, name TEXT UNIQUE, slug TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "products" (id UUID PRIMARY KEY, name TEXT, description TEXT, price DECIMAL(12,2), "imageUrl" TEXT, "isActive" BOOLEAN DEFAULT TRUE, "categoryId" UUID REFERENCES "categories"(id), "companyId" UUID, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "product_sizes" (id UUID PRIMARY KEY, size INT, stock INT DEFAULT 0, "productId" UUID REFERENCES "products"(id) ON DELETE CASCADE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW(), UNIQUE("productId", size))`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "orders" (id UUID PRIMARY KEY, "totalPrice" DECIMAL(12,2), status TEXT, notes TEXT, "userId" UUID, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
        await siloPrisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "order_items" (id UUID PRIMARY KEY, size INT, quantity INT, "unitPrice" DECIMAL(12,2), "orderId" UUID REFERENCES "orders"(id) ON DELETE CASCADE, "productId" UUID REFERENCES "products"(id), "createdAt" TIMESTAMP DEFAULT NOW())`);

        // Seed Silo Category
        const siloRunning = await siloPrisma.category.upsert({
            where: { slug: 'running' },
            update: {},
            create: { id: runningCat.id, name: 'Running', slug: 'running' }
        });

        // Seed Silo Products
        const products = [
            { name: `${c.name} Alpha`, price: 1200000, img: c.logo },
            { name: `${c.name} Beta`, price: 1500000, img: c.logo },
            { name: `${c.name} Gamma`, price: 900000, img: c.logo },
        ];

        for (const p of products) {
            const pId = randomUUID();
            // 1. Create in Silo (Truth)
            const siloProduct = await siloPrisma.product.create({
                data: {
                    id: pId,
                    name: p.name,
                    description: `High performance ${p.name} from ${c.name} isolated database.`,
                    price: p.price,
                    imageUrl: p.img,
                    categoryId: siloRunning.id,
                    companyId: c.id,
                    sizes: {
                        create: [
                            { size: 40, stock: 100 },
                            { size: 42, stock: 100 },
                        ]
                    }
                }
            });

            // 2. Create in Registry (Index)
            await registryPrisma.product.create({
                data: {
                    id: siloProduct.id,
                    name: siloProduct.name,
                    price: siloProduct.price,
                    imageUrl: siloProduct.imageUrl,
                    categoryId: runningCat.id,
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

  console.log('\n✨ ALL DATABASES SYNCHRONIZED AND USERS RESTORED! ✨');
  console.log('Test accounts (Password: Password123!):');
  console.log('- Buyer: buyer@example.com');
  console.log('- Nike Seller: seller@nike.example.com');
  console.log('- Adidas Seller: seller@adidas.example.com');
  console.log('- Puma Seller: seller@puma.example.com');
  
  await registryPrisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal Seed Error:', e);
  process.exit(1);
});
