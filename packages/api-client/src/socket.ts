import { io, type Socket } from 'socket.io-client';
import {
  ChirudeliSocketEvent,
  type OrderStatusChangedEvent,
  type DeliveryLocationUpdatedEvent,
  type Notification,
} from '@chirudeli/shared-types';

export interface OrderTrackingHandlers {
  onStatusChanged?: (event: OrderStatusChangedEvent) => void;
  onLocationUpdated?: (event: DeliveryLocationUpdatedEvent) => void;
}

/**
 * Socket.io (not raw WebSocket) so reconnection/backoff is handled for us —
 * matters on the flaky mobile networks this app targets. One socket per
 * screen lifetime; call the returned `close()` on unmount.
 */
export function subscribeToOrderTracking(
  wsUrl: string,
  orderId: string,
  accessToken: string,
  handlers: OrderTrackingHandlers,
): { socket: Socket; close: () => void } {
  const socket = io(wsUrl, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => socket.emit('join', { room: `order:${orderId}` }));
  if (handlers.onStatusChanged) {
    socket.on(ChirudeliSocketEvent.OrderStatusChanged, handlers.onStatusChanged);
  }
  if (handlers.onLocationUpdated) {
    socket.on(ChirudeliSocketEvent.DeliveryLocationUpdated, handlers.onLocationUpdated);
  }

  return { socket, close: () => socket.disconnect() };
}

export function subscribeToNotifications(
  wsUrl: string,
  userId: string,
  accessToken: string,
  onNotification: (n: Notification) => void,
): { socket: Socket; close: () => void } {
  const socket = io(wsUrl, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
  });
  socket.on('connect', () => socket.emit('join', { room: `user:${userId}` }));
  socket.on(ChirudeliSocketEvent.NotificationNew, onNotification);
  return { socket, close: () => socket.disconnect() };
}
