import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '@chirudeli/shared-types';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    request.authUser = { id: payload.sub, role: payload.role };
  } catch {
    throw new UnauthorizedError('Your session has expired. Please log in again.');
  }
}

export function requireRole(...roles: UserRole[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.authUser) throw new UnauthorizedError();
    if (!roles.includes(request.authUser.role)) throw new ForbiddenError();
  };
}
