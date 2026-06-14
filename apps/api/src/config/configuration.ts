import Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default('Bass Financial Core'),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  JWT_PRIVATE_KEY: Joi.string().allow('').default(''),
  JWT_PUBLIC_KEY: Joi.string().allow('').default(''),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});

export interface AppConfig {
  nodeEnv: string;
  port: number;
  appName: string;
  database: { url: string };
  redis: { url: string };
  jwt: {
    privateKey: string;
    publicKey: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  throttle: { ttl: number; limit: number };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  appName: process.env.APP_NAME ?? 'Bass Financial Core',
  database: { url: process.env.DATABASE_URL ?? '' },
  redis: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
  jwt: {
    privateKey: process.env.JWT_PRIVATE_KEY ?? '',
    publicKey: process.env.JWT_PUBLIC_KEY ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
});
