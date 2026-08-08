import { z } from 'zod';
import { idSchema, coordinatesSchema } from './primitives';
import { OrderStatus } from './enums';
import { orderRiderSchema, deliveryStopSchema } from './order';

/**
 * Socket.io event contracts. Room naming convention:
 *  - `order:{masterOrderId}` → customer, and (once assigned) the rider
 *  - `rider:{riderId}`       → that rider only (new delivery requests)
 *  - `business:{bizId}`      → that business's staff (new orders)
 *  - `admin:live`            → admin live-ops feed (future)
 */
export const ChirudeliSocketEvent = {
  OrderStatusChanged: 'order.status_changed',
  DeliveryLocationUpdated: 'delivery.location_updated',
  DeliveryNewRequest: 'delivery.new_request',
  NotificationNew: 'notification.new',
} as const;

export const orderStatusChangedEventSchema = z.object({
  orderId: idSchema, // master order id
  status: OrderStatus.schema, // derived overall status
  rider: orderRiderSchema.nullable(),
  estimatedArrivalMinutes: z.number().int().nullable(),
  deliveryStops: z.array(deliveryStopSchema),
  changedAt: z.string().datetime(),
});
export type OrderStatusChangedEvent = z.infer<typeof orderStatusChangedEventSchema>;

export const deliveryLocationUpdatedEventSchema = z.object({
  orderId: idSchema, // master order id
  riderId: idSchema,
  location: coordinatesSchema,
  recordedAt: z.string().datetime(),
});
export type DeliveryLocationUpdatedEvent = z.infer<typeof deliveryLocationUpdatedEventSchema>;
