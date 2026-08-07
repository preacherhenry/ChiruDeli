import type { FastifyInstance } from 'fastify';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      reply.code(error.status).send({ code: error.code, message: error.message, details: error.details });
      return;
    }

    if ('validation' in error && error.validation) {
      reply.code(400).send({ code: 'BAD_REQUEST', message: error.message });
      return;
    }

    logger.error({ err: error }, 'Unhandled error');
    reply.code(500).send({ code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ code: 'NOT_FOUND', message: 'Route not found.' });
  });
}
