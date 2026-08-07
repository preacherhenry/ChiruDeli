import { z } from 'zod';
import { idSchema, coordinatesSchema } from './primitives';
import { OrderStatus, DeliveryStatus } from './enums';
import { orderRiderSchema } from './order';

/**
 * Socket.io event contracts. Room naming convention:
 *  - `order:{orderId}`    → customer, business, assigned rider
 *  - `rider:{riderId}`    → that rider only (new delivery requests)
 *  - `business:{bizId}`   → that business's staff (new orders)
 *  - `admin:live`         → admin live-ops feed (future)
 */
export const ChirudeliSocketEvent = {
  OrderStatusChanged: 'order.status_changed',
  DeliveryLocationUpdated: 'delivery.location_updated',
  DeliveryNewRequest: 'delivery.new_request',
  NotificationNew: 'notification.new',
} as const;

export const orderStatusChangedEventSchema = z.object({
  orderId: idSchema,
  status: OrderStatus.schema,
  deliveryStatus: DeliveryStatus.schema.nullable(),
  rider: orderRiderSchema.nullable(),
  estimatedArrivalMinutes: z.number().int().nullable(),
  changedAt: z.string().datetime(),
});
export type OrderStatusChangedEvent = z.infer<typeof orderStatusChangedEventSchema>;

export const deliveryLocationUpdatedEventSchema = z.object({
  orderId: idSchema,
  riderId: idSchema,
  location: coordinatesSchema,
  recordedAt: z.string().datetime(),
});
export type DeliveryLocationUpdatedEvent = z.infer<typeof deliveryLocationUpdatedEventSchema>;
