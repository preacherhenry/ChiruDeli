import { View, Text } from 'react-native';
import type { OrderStatus } from '@chirudeli/shared-types';

const LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  RIDER_ASSIGNED: 'Rider assigned',
  PICKED_UP: 'Picked up',
  ON_THE_WAY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STYLES: Record<OrderStatus, { bg: string; text: string }> = {
  PENDING_CONFIRMATION: { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  CONFIRMED: { bg: 'bg-info/10', text: 'text-info' },
  PREPARING: { bg: 'bg-secondary-50', text: 'text-secondary-700' },
  READY_FOR_PICKUP: { bg: 'bg-secondary-50', text: 'text-secondary-700' },
  RIDER_ASSIGNED: { bg: 'bg-info/10', text: 'text-info' },
  PICKED_UP: { bg: 'bg-info/10', text: 'text-info' },
  ON_THE_WAY: { bg: 'bg-primary-50', text: 'text-primary-700' },
  DELIVERED: { bg: 'bg-primary-50', text: 'text-primary-700' },
  CANCELLED: { bg: 'bg-error/10', text: 'text-error' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = STYLES[status];
  return (
    <View className={`self-start rounded-pill px-3 py-1 ${style.bg}`}>
      <Text className={`font-body-semibold text-xs ${style.text}`}>{LABELS[status]}</Text>
    </View>
  );
}
