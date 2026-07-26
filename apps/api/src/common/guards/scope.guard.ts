import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthUser } from '../decorators/current-user.decorator';
import { ADMIN_SCOPE_KEY } from '../decorators/scope.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const GLOBAL_SCOPE = 'GLOBAL';

/**
 * Separates the two environments over a single API:
 *
 *  • ADMIN surface (`@AdminScope()`, `/api/v1/admin/*`): requires a GLOBAL-scoped
 *    role. The internal Bass team that manages ALL clients.
 *
 *  • CLIENT surface (default, tenant-scoped): a client of the gateway only ever
 *    sees its own tenant. A non-GLOBAL user may not target another tenant's
 *    `orgId`; GLOBAL users may act cross-tenant.
 *
 * Resolves and exposes `req.tenantId` for downstream controllers/services.
 * Runs after JwtAuthGuard/RolesGuard/PermissionsGuard.
 *
 * Backward compatible: tokens minted before scope separation omit `scopes`, so
 * tenant isolation is only enforced once tokens carry the claim.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(ADMIN_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser; tenantId?: string }>();
    const user = request.user;

    if (!user) {
      // A missing user on a protected route should already have been rejected by
      // JwtAuthGuard; deny defensively for admin routes.
      if (requiresAdmin) throw new ForbiddenException('Access denied');
      return true;
    }

    const isGlobal = (user.scopes ?? []).includes(GLOBAL_SCOPE);

    // Expose the acting tenant for controllers/services (single source of truth).
    request.tenantId = user.orgId;

    // --- ADMIN surface ---
    if (requiresAdmin) {
      if (!isGlobal) {
        throw new ForbiddenException('Administrative environment requires GLOBAL scope');
      }
      return true;
    }

    // --- CLIENT surface: tenant isolation ---
    // Only enforce when the token carries scopes (post-separation tokens).
    if (Array.isArray(user.scopes) && !isGlobal) {
      const requestedOrgId = this.extractOrgId(request);
      if (requestedOrgId && requestedOrgId !== user.orgId) {
        throw new ForbiddenException('Cross-tenant access denied');
      }
    }

    return true;
  }

  /**
   * Reads an explicitly-supplied tenant id from the request. Only fields named
   * `orgId` count — a generic `:id` param is not assumed to be a tenant.
   */
  private extractOrgId(
    request: Request & { body?: Record<string, unknown>; query?: Record<string, unknown> },
  ): string | undefined {
    const fromBody = request.body?.['orgId'];
    const fromQuery = request.query?.['orgId'];
    const fromParams = (request.params as Record<string, string> | undefined)?.['orgId'];
    const value = fromBody ?? fromQuery ?? fromParams;
    return typeof value === 'string' ? value : undefined;
  }
}
