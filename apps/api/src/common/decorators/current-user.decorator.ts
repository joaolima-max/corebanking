import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  orgId: string;
  status: string;
  roles: string[];
  permissions: string[];
  /**
   * RBAC scopes derived from the user's roles (GLOBAL, ORGANIZATION, WHITE_LABEL, MERCHANT).
   * Optional for backward compatibility: tokens minted before scope separation omit it.
   */
  scopes?: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
