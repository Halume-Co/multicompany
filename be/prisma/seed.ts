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

const ids = {
  nikeSeller: '11111111-1111-4111-8111-111111111111',
  adidasSeller: '22222222-2222-4222-8222-222222222222',
  buyer: '33333333-3333-4333-8333-333333333333',
  airMax: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  jordanOne: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  ultraBoost: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
  gazelle: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
};

async function resolveSeedPasswordHash(envName: string): Promise<{
  hash: string;
  hasKnownPassword: boolean;
}> {
  const password = process.env[envName]?.trim();

  if (password) {
    return {
      hash: await hashPassword(password),
      hasKnownPassword: true,
    };
  }

  return {
    hash: await hashPassword(randomUUID()),
    hasKnownPassword: false,
  };
}

async function main() {
  console.log('Seeding database...');

  const runningCat = await prisma.category.upsert({
    where: { slug: 'running' },
    update: {},
    create: { name: 'Running', slug: 'running' },
  });

  const casualCat = await prisma.category.upsert({
    where: { slug: 'casual' },
    update: {},
    create: { name: 'Casual', slug: 'casual' },
  });

  const basketballCat = await prisma.category.upsert({
    where: { slug: 'basketball' },
    update: {},
    create: { name: 'Basketball', slug: 'basketball' },
  });

  const nike = await prisma.company.upsert({
    where: { email: normalizeEmail('seller@nike.example.com') },
    update: {},
    create: {
      name: 'Nike',
      description: 'Just Do It',
      email: normalizeEmail('seller@nike.example.com'),
      phone: '+1-800-006-4532',
      address: 'One Bowerman Drive, Beaverton, OR 97005',
    },
  });

  const adidas = await prisma.company.upsert({
    where: { email: normalizeEmail('seller@adidas.example.com') },
    update: {},
    create: {
      name: 'Adidas',
      description: 'Impossible Is Nothing',
      email: normalizeEmail('seller@adidas.example.com'),
      phone: '+49-9132-84-0',
      address: 'Adi-Dassler-Str. 1, 91074 Herzogenaurach, Germany',
    },
  });

  const sellerPassword = await resolveSeedPasswordHash('SEED_SELLER_PASSWORD');
  const buyerPassword = await resolveSeedPasswordHash('SEED_BUYER_PASSWORD');

  await prisma.user.upsert({
    where: { email: normalizeEmail('nike-seller@example.com') },
    update: {
      name: 'Nike Seller',
      password: sellerPassword.hash,
      role: 'SELLER',
      companyId: nike.id,
    },
    create: {
      id: ids.nikeSeller,
      email: normalizeEmail('nike-seller@example.com'),
      name: 'Nike Seller',
      password: sellerPassword.hash,
      role: 'SELLER',
      companyId: nike.id,
    },
  });

  await prisma.user.upsert({
    where: { email: normalizeEmail('adidas-seller@example.com') },
    update: {
      name: 'Adidas Seller',
      password: sellerPassword.hash,
      role: 'SELLER',
      companyId: adidas.id,
    },
    create: {
      id: ids.adidasSeller,
      email: normalizeEmail('adidas-seller@example.com'),
      name: 'Adidas Seller',
      password: sellerPassword.hash,
      role: 'SELLER',
      companyId: adidas.id,
    },
  });

  await prisma.user.upsert({
    where: { email: normalizeEmail('buyer@example.com') },
    update: {
      name: 'Test Buyer',
      password: buyerPassword.hash,
      role: 'BUYER',
      companyId: null,
    },
    create: {
      id: ids.buyer,
      email: normalizeEmail('buyer@example.com'),
      name: 'Test Buyer',
      password: buyerPassword.hash,
      role: 'BUYER',
    },
  });

  const airMax = await prisma.product.upsert({
    where: { id: ids.airMax },
    update: {},
    create: {
      id: ids.airMax,
      name: 'Nike Air Max 270',
      description:
        'The Nike Air Max 270 delivers a supersoft ride with foam built for all-day comfort.',
      price: 1500000,
      imageUrl: 'https://example.com/images/nike-airmax-270.jpg',
      categoryId: runningCat.id,
      companyId: nike.id,
      sizes: {
        create: [
          { size: 38, stock: 10 },
          { size: 39, stock: 8 },
          { size: 40, stock: 15 },
          { size: 41, stock: 12 },
          { size: 42, stock: 6 },
          { size: 43, stock: 4 },
        ],
      },
    },
  });

  const jordanOne = await prisma.product.upsert({
    where: { id: ids.jordanOne },
    update: {},
    create: {
      id: ids.jordanOne,
      name: 'Air Jordan 1 Retro High OG',
      description:
        'Originally designed for Michael Jordan, the Air Jordan 1 Retro High OG is a timeless icon.',
      price: 2200000,
      imageUrl: 'https://example.com/images/jordan-1.jpg',
      categoryId: basketballCat.id,
      companyId: nike.id,
      sizes: {
        create: [
          { size: 40, stock: 5 },
          { size: 41, stock: 7 },
          { size: 42, stock: 9 },
          { size: 43, stock: 3 },
        ],
      },
    },
  });

  const ultraBoost = await prisma.product.upsert({
    where: { id: ids.ultraBoost },
    update: {},
    create: {
      id: ids.ultraBoost,
      name: 'Adidas Ultraboost 22',
      description:
        'The Adidas Ultraboost 22 features BOOST midsole technology for incredible energy return.',
      price: 1800000,
      imageUrl: 'https://example.com/images/ultraboost-22.jpg',
      categoryId: runningCat.id,
      companyId: adidas.id,
      sizes: {
        create: [
          { size: 38, stock: 12 },
          { size: 39, stock: 10 },
          { size: 40, stock: 14 },
          { size: 41, stock: 8 },
          { size: 42, stock: 5 },
        ],
      },
    },
  });

  const gazelle = await prisma.product.upsert({
    where: { id: ids.gazelle },
    update: {},
    create: {
      id: ids.gazelle,
      name: 'Adidas Gazelle',
      description:
        'Classic suede upper, iconic 3-Stripes. The Adidas Gazelle is a street style staple.',
      price: 900000,
      imageUrl: 'https://example.com/images/gazelle.jpg',
      categoryId: casualCat.id,
      companyId: adidas.id,
      sizes: {
        create: [
          { size: 38, stock: 20 },
          { size: 39, stock: 18 },
          { size: 40, stock: 25 },
          { size: 41, stock: 15 },
          { size: 42, stock: 10 },
          { size: 43, stock: 8 },
        ],
      },
    },
  });

  console.log('Database seeded successfully.');
  console.log(
    `Sample users seeded with known passwords: sellers=${sellerPassword.hasKnownPassword}, buyer=${buyerPassword.hasKnownPassword}`,
  );
  console.log(
    `Products seeded: ${airMax.name}, ${jordanOne.name}, ${ultraBoost.name}, ${gazelle.name}`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
