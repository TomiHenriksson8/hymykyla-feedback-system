import 'dotenv/config';

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 8080),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  NODE_ENV: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',

  JWT_SECRET: requireEnv('JWT_SECRET'),
  COOKIE_NAME: process.env.COOKIE_NAME ?? 'hymy_admin',

  ADMIN_EMAIL: requireEnv('ADMIN_EMAIL'),
  ADMIN_PASSWORD: requireEnv('ADMIN_PASSWORD'),
};

