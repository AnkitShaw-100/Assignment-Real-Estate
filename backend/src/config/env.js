import { z } from 'zod';

// Validate env once at boot so a missing variable fails loudly
// instead of surfacing later as a confusing runtime error.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().optional(),
  DNS_SERVERS: z.string().default(''),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ADMIN_EMAILS: z.string().default(''),
  // Signs session tokens. Required in production; a fixed dev value is used otherwise.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables', z.flattenError(parsed.error).fieldErrors);
  throw new Error('Invalid environment variables');
}
if (!parsed.data.JWT_SECRET && parsed.data.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  jwtSecret: parsed.data.JWT_SECRET ?? 'niwas-development-only-secret-do-not-use-in-prod',
  // Comma separated lists → arrays
  clientOrigins: parsed.data.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean),
  dnsServers: parsed.data.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean),
  adminEmails: parsed.data.ADMIN_EMAILS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  cloudinaryEnabled: Boolean(
    parsed.data.CLOUDINARY_CLOUD_NAME && parsed.data.CLOUDINARY_API_KEY && parsed.data.CLOUDINARY_API_SECRET,
  ),
};
