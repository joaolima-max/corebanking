import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Bass Financial Core API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['api/health', 'api/.well-known/jwks.json'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health → 200 ok', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
        });
    });
  });

  describe('Auth', () => {
    const testEmail = `e2e-${Date.now()}@test.com`;
    const testPassword = 'Test@1234!';
    let accessToken: string;
    let refreshToken: string;

    it('POST /api/v1/auth/register → 201', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ fullName: 'E2E Test User', email: testEmail, password: testPassword, orgName: 'E2E Org' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('userId');
          expect(res.body.data).toHaveProperty('email', testEmail);
        });
    });

    it('POST /api/v1/auth/register duplicate → 409', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ fullName: 'E2E Test User', email: testEmail, password: testPassword, orgName: 'E2E Org 2' })
        .expect(409);
    });

    it('POST /api/v1/auth/login → 200 with tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('requiresMfa', false);
          expect(res.body.data.tokens).toHaveProperty('accessToken');
          expect(res.body.data.tokens).toHaveProperty('refreshToken');
          accessToken = res.body.data.tokens.accessToken as string;
          refreshToken = res.body.data.tokens.refreshToken as string;
        });
    });

    it('POST /api/v1/auth/login wrong password → 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'Wrong@Pass1!' })
        .expect(401);
    });

    it('GET /api/v1/auth/me → 200 with user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('email', testEmail);
        });
    });

    it('POST /api/v1/auth/token/refresh → 200 new tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/token/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          accessToken = res.body.data.accessToken as string;
        });
    });

    it('GET /.well-known/jwks.json → 200', () => {
      return request(app.getHttpServer())
        .get('/api/.well-known/jwks.json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('Ledger — double-entry invariant', () => {
    let accessToken: string;
    let orgId: string;
    let ledgerAccountDebitId: string;
    let ledgerAccountCreditId: string;

    beforeAll(async () => {
      // Register + login as a fresh user with their own org
      const email = `ledger-e2e-${Date.now()}@test.com`;
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ fullName: 'Ledger E2E', email, password: 'Test@1234!', orgName: 'Ledger Test Org' });

      orgId = registerRes.body.data?.orgId as string;

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'Test@1234!' });

      accessToken = loginRes.body.data?.tokens?.accessToken as string;

      // Need admin tokens to create ledger accounts — use seeded admin
      const adminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@basspago.com.br', password: 'Admin@123!' });

      const adminToken = adminLogin.body.data?.tokens?.accessToken as string;

      // Get Bass Pago org id
      const orgsRes = await request(app.getHttpServer())
        .get('/api/v1/organizations?type=BASS')
        .set('Authorization', `Bearer ${adminToken}`);

      const bassOrgId = orgsRes.body.data?.[0]?.id as string;

      // Create two ledger accounts for testing
      const debitRes = await request(app.getHttpServer())
        .post('/api/v1/ledger/accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orgId: bassOrgId, code: 'E2E.1.1', name: 'E2E Debit Account', type: 'ASSET', currency: 'BRL' });

      ledgerAccountDebitId = debitRes.body.data?.id as string;

      const creditRes = await request(app.getHttpServer())
        .post('/api/v1/ledger/accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orgId: bassOrgId, code: 'E2E.2.1', name: 'E2E Credit Account', type: 'LIABILITY', currency: 'BRL' });

      ledgerAccountCreditId = creditRes.body.data?.id as string;
      orgId = bassOrgId;
      accessToken = adminToken;
    });

    it('POST /api/v1/ledger/journal-entries with Σ DR ≠ Σ CR → 422', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ledger/journal-entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orgId,
          description: 'Unbalanced entry test',
          idempotencyKey: `e2e-unbalanced-${Date.now()}`,
          lines: [
            { ledgerAccountId: ledgerAccountDebitId, direction: 'DEBIT', amount: 100.00 },
            { ledgerAccountId: ledgerAccountCreditId, direction: 'CREDIT', amount: 99.99 },
          ],
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toMatch(/double-entry invariant/i);
        });
    });

    it('POST /api/v1/ledger/journal-entries with Σ DR = Σ CR → 201', async () => {
      const idempotencyKey = `e2e-balanced-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/ledger/journal-entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orgId,
          description: 'Balanced entry test',
          idempotencyKey,
          lines: [
            { ledgerAccountId: ledgerAccountDebitId, direction: 'DEBIT', amount: 100.00 },
            { ledgerAccountId: ledgerAccountCreditId, direction: 'CREDIT', amount: 100.00 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('status', 'POSTED');

      const jeId: string = res.body.data.id as string;

      // Idempotency: same key returns same JE
      const idempotentRes = await request(app.getHttpServer())
        .post('/api/v1/ledger/journal-entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orgId,
          description: 'Should return existing JE',
          idempotencyKey,
          lines: [
            { ledgerAccountId: ledgerAccountDebitId, direction: 'DEBIT', amount: 100.00 },
            { ledgerAccountId: ledgerAccountCreditId, direction: 'CREDIT', amount: 100.00 },
          ],
        });

      expect(idempotentRes.status).toBe(201);
      expect(idempotentRes.body.data.id).toBe(jeId);
    });

    it('POST /api/v1/ledger/journal-entries/:id/void → 200 with reversal', async () => {
      // Create a JE to void
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/ledger/journal-entries')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          orgId,
          description: 'Entry to void',
          idempotencyKey: `e2e-void-${Date.now()}`,
          lines: [
            { ledgerAccountId: ledgerAccountDebitId, direction: 'DEBIT', amount: 50.00 },
            { ledgerAccountId: ledgerAccountCreditId, direction: 'CREDIT', amount: 50.00 },
          ],
        });

      const jeId: string = createRes.body.data.id as string;

      const voidRes = await request(app.getHttpServer())
        .post(`/api/v1/ledger/journal-entries/${jeId}/void`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(voidRes.status).toBe(200);
      expect(voidRes.body.data).toHaveProperty('status', 'POSTED');
      expect(voidRes.body.data.description).toMatch(/^VOID:/);
    });
  });

  describe('Unauthenticated access → 401', () => {
    it('GET /api/v1/users → 401', () => {
      return request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });

    it('GET /api/v1/accounts → 401', () => {
      return request(app.getHttpServer()).get('/api/v1/accounts').expect(401);
    });

    it('GET /api/v1/ledger/journal-entries → 401', () => {
      return request(app.getHttpServer()).get('/api/v1/ledger/journal-entries').expect(401);
    });
  });
});
