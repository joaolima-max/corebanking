import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { ScopeGuard } from './scope.guard';
import { ADMIN_SCOPE_KEY } from '../decorators/scope.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'u1',
    email: 'u@x.com',
    fullName: 'U',
    orgId: 'org-A',
    status: 'ACTIVE',
    roles: [],
    permissions: [],
    ...overrides,
  };
}

function makeContext(opts: {
  user?: AuthUser;
  meta?: { admin?: boolean; public?: boolean };
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
}): { ctx: ExecutionContext; request: Record<string, unknown>; reflector: Reflector } {
  const request: Record<string, unknown> = {
    user: opts.user,
    body: opts.body ?? {},
    query: opts.query ?? {},
    params: opts.params ?? {},
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  } as unknown as ExecutionContext;

  const reflector = {
    getAllAndOverride: (key: string) => {
      if (key === IS_PUBLIC_KEY) return opts.meta?.public ?? false;
      if (key === ADMIN_SCOPE_KEY) return opts.meta?.admin ?? false;
      return undefined;
    },
  } as unknown as Reflector;

  return { ctx, request, reflector };
}

describe('ScopeGuard — environment separation', () => {
  it('allows public routes without a user', () => {
    const { ctx, reflector } = makeContext({ meta: { public: true } });
    expect(new ScopeGuard(reflector).canActivate(ctx)).toBe(true);
  });

  describe('ADMIN surface (@AdminScope)', () => {
    it('allows a GLOBAL-scoped user', () => {
      const { ctx, reflector } = makeContext({
        user: makeUser({ scopes: ['GLOBAL'] }),
        meta: { admin: true },
      });
      expect(new ScopeGuard(reflector).canActivate(ctx)).toBe(true);
    });

    it('forbids a non-GLOBAL user', () => {
      const { ctx, reflector } = makeContext({
        user: makeUser({ scopes: ['MERCHANT'] }),
        meta: { admin: true },
      });
      expect(() => new ScopeGuard(reflector).canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('forbids a user whose token predates scopes (undefined)', () => {
      const { ctx, reflector } = makeContext({
        user: makeUser({ scopes: undefined }),
        meta: { admin: true },
      });
      expect(() => new ScopeGuard(reflector).canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('CLIENT surface — tenant isolation', () => {
    it('forbids a tenant user targeting another tenant orgId (query)', () => {
      const { ctx, reflector } = makeContext({
        user: makeUser({ scopes: ['MERCHANT'], orgId: 'org-A' }),
        query: { orgId: 'org-B' },
      });
      expect(() => new ScopeGuard(reflector).canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows a tenant user targeting its own orgId', () => {
      const { ctx, request, reflector } = makeContext({
        user: makeUser({ scopes: ['MERCHANT'], orgId: 'org-A' }),
        body: { orgId: 'org-A' },
      });
      expect(new ScopeGuard(reflector).canActivate(ctx)).toBe(true);
      expect(request.tenantId).toBe('org-A');
    });

    it('allows a GLOBAL user to act cross-tenant', () => {
      const { ctx, reflector } = makeContext({
        user: makeUser({ scopes: ['GLOBAL'], orgId: 'org-A' }),
        query: { orgId: 'org-B' },
      });
      expect(new ScopeGuard(reflector).canActivate(ctx)).toBe(true);
    });

    it('does not enforce isolation for legacy tokens without scopes', () => {
      const { ctx, reflector } = makeContext({
        user: makeUser({ scopes: undefined, orgId: 'org-A' }),
        query: { orgId: 'org-B' },
      });
      expect(new ScopeGuard(reflector).canActivate(ctx)).toBe(true);
    });

    it('exposes req.tenantId as the acting tenant', () => {
      const { ctx, request, reflector } = makeContext({
        user: makeUser({ scopes: ['GLOBAL'], orgId: 'org-A' }),
      });
      new ScopeGuard(reflector).canActivate(ctx);
      expect(request.tenantId).toBe('org-A');
    });
  });
});
