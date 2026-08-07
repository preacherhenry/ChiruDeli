import type { UserRole } from '@chirudeli/shared-types';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { ConflictError, UnauthorizedError, ValidationError } from '../../lib/errors';
import { env } from '../../lib/env';
import { issueOtp, verifyOtp as checkOtp } from '../../lib/otpStore';
import { smsProvider } from '../../lib/sms';
import { recordAudit } from '../../lib/audit';

function issueTokens(userId: string, role: UserRole) {
  return {
    accessToken: signAccessToken({ sub: userId, role }),
    refreshToken: signRefreshToken({ sub: userId, role }),
  };
}

function toSessionUser(user: { id: string; role: UserRole; phone: string }, fullName: string) {
  return { id: user.id, role: user.role, phone: user.phone, fullName };
}

export async function registerCustomer(input: {
  fullName: string;
  phone: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existing) throw new ConflictError('An account with this phone number already exists.');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      passwordHash,
      role: 'CUSTOMER',
      customer: { create: { displayName: input.fullName } },
    },
  });
  await recordAudit({ actorUserId: user.id, action: 'CUSTOMER_REGISTERED', entityType: 'User', entityId: user.id });

  return {
    user: toSessionUser(user, input.fullName),
    tokens: issueTokens(user.id, user.role),
  };
}

async function loginWithPassword(phone: string, password: string, allowedRoles: UserRole[]) {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { customer: true, rider: true, adminUser: true, businesses: true },
  });
  if (!user || !allowedRoles.includes(user.role)) {
    throw new UnauthorizedError('Incorrect phone number or password.');
  }
  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('This account has been suspended. Contact support.');
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Incorrect phone number or password.');

  const fullName =
    user.customer?.displayName ??
    user.rider?.fullName ??
    user.adminUser?.fullName ??
    user.businesses[0]?.name ??
    'ChiruDeli User';

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { user: toSessionUser(user, fullName), tokens: issueTokens(user.id, user.role) };
}

export const loginCustomer = (phone: string, password: string) =>
  loginWithPassword(phone, password, ['CUSTOMER']);
export const loginBusiness = (phone: string, password: string) =>
  loginWithPassword(phone, password, ['BUSINESS_OWNER']);
export const loginRider = (phone: string, password: string) =>
  loginWithPassword(phone, password, ['RIDER']);
export const loginAdmin = (phone: string, password: string) =>
  loginWithPassword(phone, password, ['ADMIN']);

export async function requestOtp(phone: string) {
  const code = issueOtp(phone);
  await smsProvider.sendOtp(phone, code);
  return env.NODE_ENV === 'production' ? { sent: true as const } : { sent: true as const, devCode: code };
}

export async function verifyOtpAndLogin(phone: string, code: string) {
  if (!checkOtp(phone, code)) {
    throw new ValidationError('That code is invalid or has expired.');
  }

  let user = await prisma.user.findUnique({ where: { phone }, include: { customer: true } });
  if (!user) {
    const passwordHash = await hashPassword(`otp-only-${Date.now()}-${Math.random()}`);
    user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        role: 'CUSTOMER',
        customer: { create: { displayName: 'ChiruDeli Customer' } },
      },
      include: { customer: true },
    });
    await recordAudit({ actorUserId: user.id, action: 'CUSTOMER_REGISTERED_VIA_OTP', entityType: 'User', entityId: user.id });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return {
    user: toSessionUser(user, user.customer?.displayName ?? 'ChiruDeli Customer'),
    tokens: issueTokens(user.id, user.role),
  };
}

export async function refreshSession(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Please log in again.');
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { customer: true, rider: true, adminUser: true, businesses: true },
  });
  if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('Please log in again.');

  const fullName =
    user.customer?.displayName ??
    user.rider?.fullName ??
    user.adminUser?.fullName ??
    user.businesses[0]?.name ??
    'ChiruDeli User';

  return { user: toSessionUser(user, fullName), tokens: issueTokens(user.id, user.role) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true, rider: true, adminUser: true, businesses: true },
  });
  if (!user || user.status !== 'ACTIVE') throw new UnauthorizedError('Please log in again.');

  const fullName =
    user.customer?.displayName ??
    user.rider?.fullName ??
    user.adminUser?.fullName ??
    user.businesses[0]?.name ??
    'ChiruDeli User';

  return toSessionUser(user, fullName);
}
