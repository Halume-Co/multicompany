import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

// Load .env file sebelum Prisma CLI membaca config ini
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
