import { logger } from './logger';

export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

/**
 * No SMS gateway account exists yet (Africa's Talking / Twilio are the
 * obvious choices for Zambia). This stub just logs the code — the OTP
 * endpoints also echo it back in the response in non-production so the
 * flow is genuinely testable end-to-end without a real gateway.
 */
export class ConsoleSmsProvider implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    logger.info({ phone, code }, '[ConsoleSmsProvider] OTP (would be sent via SMS)');
  }
}

export const smsProvider: SmsProvider = new ConsoleSmsProvider();
