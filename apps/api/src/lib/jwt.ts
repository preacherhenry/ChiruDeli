import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@chirudeli/shared-types';
import { env } from './env';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

// jsonwebtoken's SignOptions['expiresIn'] is typed against a branded string
// literal (from the `ms` package) that plain `string` env vars don't satisfy —
// the values themselves ("15m", "30d") are valid at runtime.
const accessTokenOptions: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
const refreshTokenOptions: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessTokenOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
