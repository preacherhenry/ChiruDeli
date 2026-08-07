import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  registerCustomerSchema,
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from '@chirudeli/shared-types';
import { parseOrThrow } from '../../lib/validate';
import * as authService from './auth.service';
import { authenticate } from '../../middleware/authenticate';

const refreshBodySchema = z.object({ refreshToken: z.string() });

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/customer/register', async (req, reply) => {
    const input = parseOrThrow(registerCustomerSchema, req.body);
    const result = await authService.registerCustomer(input);
    reply.code(201).send(result);
  });

  app.post('/auth/customer/login', async (req) => {
    const input = parseOrThrow(loginSchema, req.body);
    return authService.loginCustomer(input.phone, input.password);
  });

  app.post('/auth/business/login', async (req) => {
    const input = parseOrThrow(loginSchema, req.body);
    return authService.loginBusiness(input.phone, input.password);
  });

  app.post('/auth/rider/login', async (req) => {
    const input = parseOrThrow(loginSchema, req.body);
    return authService.loginRider(input.phone, input.password);
  });

  app.post('/auth/admin/login', async (req) => {
    const input = parseOrThrow(loginSchema, req.body);
    return authService.loginAdmin(input.phone, input.password);
  });

  app.post('/auth/customer/otp/request', async (req) => {
    const input = parseOrThrow(requestOtpSchema, req.body);
    return authService.requestOtp(input.phone);
  });

  app.post('/auth/customer/otp/verify', async (req) => {
    const input = parseOrThrow(verifyOtpSchema, req.body);
    return authService.verifyOtpAndLogin(input.phone, input.code);
  });

  app.post('/auth/refresh', async (req) => {
    const input = parseOrThrow(refreshBodySchema, req.body);
    return authService.refreshSession(input.refreshToken);
  });

  app.post('/auth/logout', { preHandler: authenticate }, async (_req, reply) => {
    reply.code(204).send();
  });

  app.get('/auth/me', { preHandler: authenticate }, async (req) => {
    return authService.getCurrentUser(req.authUser!.id);
  });
}
