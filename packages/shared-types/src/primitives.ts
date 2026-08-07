import { z } from 'zod';

/** ZMW amounts cross the API as plain numbers rounded to 2dp (Prisma stores Decimal). */
export const moneySchema = z.number().nonnegative().multipleOf(0.01);

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof coordinatesSchema>;

export const idSchema = z.string().uuid();

export const phoneSchema = z
  .string()
  .regex(/^\+260\d{9}$/, 'Use Zambian format: +260XXXXXXXXX');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}
