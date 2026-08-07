import 'fastify';
import type { UserRole } from '@chirudeli/shared-types';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: { id: string; role: UserRole };
  }
}
