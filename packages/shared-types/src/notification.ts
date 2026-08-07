import { z } from 'zod';
import { idSchema } from './primitives';
import { NotificationType } from './enums';

export const notificationSchema = z.object({
  id: idSchema,
  type: NotificationType.schema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof notificationSchema>;
