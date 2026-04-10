import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
  GITHUB_ORG: z.string().min(1),
  PRODUCT_DOCS_REPO: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_INSTALLATION_ID: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

const value = parsed.data;

export const env = {
  port: Number(value.PORT),
  allowedOrigin: value.ALLOWED_ORIGIN,
  githubOrg: value.GITHUB_ORG,
  productDocsRepo: value.PRODUCT_DOCS_REPO,
  githubAppId: value.GITHUB_APP_ID,
  githubAppInstallationId: Number(value.GITHUB_APP_INSTALLATION_ID),
  githubAppPrivateKey: value.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
};
