import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  GHL_API_BASE_URL: z.string().optional(),
  GHL_OAUTH_CLIENT_ID: z.string().optional(),
  GHL_OAUTH_CLIENT_SECRET: z.string().optional(),
  GHL_OAUTH_REDIRECT_URI: z.string().optional(),
  STORAGE_PROVIDER: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  QUEUE_PROVIDER: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  GHL_API_BASE_URL: process.env.GHL_API_BASE_URL,
  GHL_OAUTH_CLIENT_ID: process.env.GHL_OAUTH_CLIENT_ID,
  GHL_OAUTH_CLIENT_SECRET: process.env.GHL_OAUTH_CLIENT_SECRET,
  GHL_OAUTH_REDIRECT_URI: process.env.GHL_OAUTH_REDIRECT_URI,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  STORAGE_BUCKET: process.env.STORAGE_BUCKET,
  QUEUE_PROVIDER: process.env.QUEUE_PROVIDER,
  REDIS_URL: process.env.REDIS_URL,
});
