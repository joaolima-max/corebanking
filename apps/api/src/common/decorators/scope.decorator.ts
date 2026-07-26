import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route (or whole controller) as belonging to the ADMIN surface
 * (`/api/v1/admin/*`). Only users carrying a GLOBAL-scoped role — the internal
 * Bass administrative environment — may access it. Enforced by `ScopeGuard`.
 */
export const ADMIN_SCOPE_KEY = 'admin_scope';
export const AdminScope = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(ADMIN_SCOPE_KEY, true);
