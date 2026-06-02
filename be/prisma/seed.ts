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

async function resolveSeedPasswordHash(envName: string): Promise<{
  hash: string;
  hasKnownPassword: boolean;
}> {
  const password = process.env[envName]?.trim();
  if (password) {
    return { hash: await hashPassword(password), hasKnownPassword: true };
  }
  return { hash: await hashPassword(randomUUID()), hasKnownPassword: false };
}

async function main() {
  console.log('🚀 Starting Advanced Seeding...');

  // 1. Categories
  const categories = {
    running: await prisma.category.upsert({ where: { slug: 'running' }, update: {}, create: { name: 'Running', slug: 'running' } }),
    casual: await prisma.category.upsert({ where: { slug: 'casual' }, update: {}, create: { name: 'Casual', slug: 'casual' } }),
    basketball: await prisma.category.upsert({ where: { slug: 'basketball' }, update: {}, create: { name: 'Basketball', slug: 'basketball' } }),
    formal: await prisma.category.upsert({ where: { slug: 'formal' }, update: {}, create: { name: 'Formal', slug: 'formal' } }),
  };

  // 2. Companies
  const nike = await prisma.company.upsert({
    where: { email: normalizeEmail('seller@nike.example.com') },
    update: { logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&h=100&q=80' },
    create: { name: 'Nike', description: 'Just Do It', email: normalizeEmail('seller@nike.example.com'), phone: '+1-800-006-4532', address: 'Beaverton, OR', logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&h=100&q=80' },
  });

  const adidas = await prisma.company.upsert({
    where: { email: normalizeEmail('seller@adidas.example.com') },
    update: { logoUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=100&h=100&q=80' },
    create: { name: 'Adidas', description: 'Impossible Is Nothing', email: normalizeEmail('seller@adidas.example.com'), phone: '+49-9132-84-0', address: 'Herzogenaurach, Germany', logoUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=100&h=100&q=80' },
  });

  const puma = await prisma.company.upsert({
    where: { email: normalizeEmail('seller@puma.example.com') },
    update: { logoUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=100&h=100&q=80' },
    create: { name: 'Puma', description: 'Forever Faster', email: normalizeEmail('seller@puma.example.com'), phone: '+49-9132-81-0', address: 'Herzogenaurach, Germany', logoUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=100&h=100&q=80' },
  });

  // 3. Products Data
  const productsToSeed = [
    // NIKE
    { name: 'Nike Air Max 270', price: 1500000, cat: 'running', comp: nike, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
    { name: 'Air Jordan 1 Retro', price: 2200000, cat: 'basketball', comp: nike, img: 'https://images.unsplash.com/photo-1597043530274-0570b8655099?auto=format&fit=crop&w=600&q=80' },
    { name: 'Nike Zoom Fly 5', price: 1750000, cat: 'running', comp: nike, img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80' },
    { name: 'Nike Court Vision', price: 850000, cat: 'casual', comp: nike, img: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=600&q=80' },
    
    // ADIDAS
    { name: 'Adidas Ultraboost 22', price: 1800000, cat: 'running', comp: adidas, img: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80' },
    { name: 'Adidas Gazelle', price: 900000, cat: 'casual', comp: adidas, img: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=600&q=80' },
    { name: 'Adidas Forum Low', price: 1200000, cat: 'casual', comp: adidas, img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80' },
    { name: 'Adidas Predator', price: 2100000, cat: 'basketball', comp: adidas, img: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80' },

    // PUMA
    { name: 'Puma RS-X', price: 1100000, cat: 'casual', comp: puma, img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80' },
    { name: 'Puma Velocity Nitro', price: 1400000, cat: 'running', comp: puma, img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80' },
    { name: 'Puma Cali Star', price: 950000, cat: 'casual', comp: puma, img: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Puma Suede Classic', price: 750000, cat: 'casual', comp: puma, img: 'https://images.unsplash.com/photo-1512374382149-433261027315?auto=format&fit=crop&w=600&q=80' },
  ];

  for (const p of productsToSeed) {
    const slug = p.name.toLowerCase().replace(/ /g, '-');
    await prisma.product.upsert({
      where: { id: randomUUID() }, // This is a bit hacky for upsert, but since we are seeding many, it's better to just create or find by name if we had a slug
      update: {},
      create: {
        name: p.name,
        description: `Premium ${p.name} from ${p.comp.name}.`,
        price: p.price,
        imageUrl: p.img,
        categoryId: categories[p.cat as keyof typeof categories].id,
        companyId: p.comp.id,
        sizes: {
          create: [
            { size: 38, stock: Math.floor(Math.random() * 20) + 5 },
            { size: 39, stock: Math.floor(Math.random() * 20) + 5 },
            { size: 40, stock: Math.floor(Math.random() * 20) + 5 },
            { size: 41, stock: Math.floor(Math.random() * 20) + 5 },
            { size: 42, stock: Math.floor(Math.random() * 20) + 5 },
          ],
        },
      },
    });
  }

  console.log('✅ Advanced Seeding completed successfully!');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
