import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import * as crypto from 'crypto';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

// If DIRECT_URL is not explicitly set, fall back to DATABASE_URL (same connection for Railway)
if (!process.env['DIRECT_URL'] && process.env['DATABASE_URL']) {
  process.env['DIRECT_URL'] = process.env['DATABASE_URL'];
}

// Startup diagnostics — helps identify missing env vars in Railway/cloud
console.log('[Startup] CWD:', process.cwd());
console.log('[Startup] ALL ENV keys (', Object.keys(process.env).length, '):', Object.keys(process.env).sort().join(', '));
console.log(
  '[Startup] ENV check:',
  ['DATABASE_URL', 'DIRECT_URL', 'REDIS_URL', 'NODE_ENV', 'PORT', 'JWT_PRIVATE_KEY']
    .map((k) => `${k}=${process.env[k] ? '✓' : '✗ MISSING'}`)
    .join(' | '),
);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<AppConfig>);
  const jwtConfig = configService.get<AppConfig['jwt']>('jwt');

  // Auto-generate RSA keys in dev if not set
  if (!jwtConfig?.privateKey) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    process.env['JWT_PRIVATE_KEY'] = privateKey;
    process.env['JWT_PUBLIC_KEY'] = publicKey;
  }

  app.use(helmet());
  app.use(compression());

  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',').filter(Boolean);
  if (!allowedOrigins?.length && process.env['NODE_ENV'] === 'production') {
    throw new Error('ALLOWED_ORIGINS must be set in production');
  }
  app.enableCors({
    origin: allowedOrigins?.length ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Idempotency-Key'],
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

  const nodeEnv = configService.get<string>('nodeEnv') ?? 'development';
  const config = new DocumentBuilder()
    .setTitle('Bass Financial Core API')
    .setDescription('Core banking platform — IAM, Organizations, Accounts, Ledger')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Roles')
    .addTag('Permissions')
    .addTag('Organizations')
    .addTag('Accounts')
    .addTag('Ledger')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  if (nodeEnv !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<AppConfig['port']>('port') ?? 3000;
  await app.listen(port);

  const logger = new (await import('@nestjs/common')).Logger('Bootstrap');
  logger.log(`Bass Financial Core API running on port ${port}`);
  if (nodeEnv !== 'production') {
    logger.log(`Swagger UI: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch(console.error);
