import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { AdminClientsController } from './clients/admin-clients.controller';

/**
 * ADMIN surface (`/api/v1/admin/*`) — the internal Bass administrative
 * environment that manages ALL clients. Every controller here is `@AdminScope()`
 * and reuses the shared domain modules; it does not duplicate business logic.
 *
 * Kept as a separate module (not separate deployable) — a modular monolith with
 * a clearly delimited administrative boundary, per docs/ENVIRONMENTS.md.
 */
@Module({
  imports: [OrganizationsModule],
  controllers: [AdminClientsController],
})
export class AdminModule {}
