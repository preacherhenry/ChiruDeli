/**
 * In-memory OTP store — fine for a single-process dev/demo deployment.
 * A production deployment with multiple API instances would move this to
 * Redis; the interface below is intentionally small so that swap is local.
 */
const codes = new Map<string, { code: string; expiresAt: number }>();
const OTP_TTL_MS = 5 * 60 * 1000;

export function issueOtp(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = codes.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    codes.delete(phone);
    return false;
  }
  const matches = entry.code === code;
  if (matches) codes.delete(phone);
  return matches;
}
