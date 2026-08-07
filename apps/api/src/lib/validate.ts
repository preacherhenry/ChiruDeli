import type { ZodTypeAny, z } from 'zod';
import { ValidationError } from './errors';

export function parseOrThrow<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Some fields need your attention.', result.error.flatten());
  }
  return result.data;
}
