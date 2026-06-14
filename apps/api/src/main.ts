import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import * as crypto from 'crypto';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

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

  app.enableCors({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Idempotency-Key'],
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
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<AppConfig['port']>('port') ?? 3000;
  await app.listen(port);

  console.log(`🚀 Bass Financial Core API running on port ${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap().catch(console.error);
