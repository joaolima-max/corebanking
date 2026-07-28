import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import * as crypto from 'crypto';
import { AppModule } from './app.module';

// Shared JWT key setup — mirrors main.ts. Runs before Nest init.
function setupJwtKeys(): void {
  const raw = process.env['JWT_PRIVATE_KEY'] ?? '';
  if (raw) {
    try {
      crypto.createPrivateKey(raw);
      return;
    } catch {
      // fall through to ephemeral generation
    }
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  process.env['JWT_PRIVATE_KEY'] = privateKey;
  process.env['JWT_PUBLIC_KEY'] = publicKey;
}

let cached: express.Express | null = null;

/**
 * Builds the Nest application on top of a bare Express instance and initialises
 * it (without listening) so it can be used as a serverless handler on Vercel.
 * The Express instance is cached across warm invocations.
 */
export async function createApp(): Promise<express.Express> {
  if (cached) return cached;

  if (!process.env['DIRECT_URL'] && process.env['DATABASE_URL']) {
    process.env['DIRECT_URL'] = process.env['DATABASE_URL'];
  }
  setupJwtKeys();

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.use(helmet());
  app.use(compression());

  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',').filter(Boolean);
  app.enableCors({
    origin: allowedOrigins?.length ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Idempotency-Key', 'X-Setup-Key'],
    credentials: false,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['api/health', 'api/.well-known/jwks.json'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  cached = server;
  return server;
}
