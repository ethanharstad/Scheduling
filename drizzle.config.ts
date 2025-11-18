import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: '5165cf85-72a2-48f4-ace8-8d8e44d12736',
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
