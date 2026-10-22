import { z } from 'zod';

// Validate env once at boot so a missing variable fails loudly
// instead of surfacing later as a confusing runtime error.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().optional(),
  DNS_SERVERS: z.string().default(''),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  // The admin account. Its password lives only in the server settings.
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()).optional(),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters').optional(),
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
  // Admin sign-in is enabled only when both are set
  admin: parsed.data.ADMIN_EMAIL && parsed.data.ADMIN_PASSWORD ? { email: parsed.data.ADMIN_EMAIL, password: parsed.data.ADMIN_PASSWORD } : null,
  cloudinaryEnabled: Boolean(
    parsed.data.CLOUDINARY_CLOUD_NAME && parsed.data.CLOUDINARY_API_KEY && parsed.data.CLOUDINARY_API_SECRET,
  ),
};
