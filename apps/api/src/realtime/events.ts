import {
  ChirudeliSocketEvent,
  type OrderStatusChangedEvent,
  type DeliveryLocationUpdatedEvent,
  type Notification,
} from '@chirudeli/shared-types';
import { getIo } from './socket';

export function emitOrderStatusChanged(orderId: string, event: OrderStatusChangedEvent) {
  getIo().to(`order:${orderId}`).emit(ChirudeliSocketEvent.OrderStatusChanged, event);
}

export function emitDeliveryLocationUpdated(orderId: string, event: DeliveryLocationUpdatedEvent) {
  getIo().to(`order:${orderId}`).emit(ChirudeliSocketEvent.DeliveryLocationUpdated, event);
}

export function emitNotification(userId: string, notification: Notification) {
  getIo().to(`user:${userId}`).emit(ChirudeliSocketEvent.NotificationNew, notification);
}
