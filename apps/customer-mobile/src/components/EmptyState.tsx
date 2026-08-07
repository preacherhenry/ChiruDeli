import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50">
        <Icon color="#0E6E4E" size={28} />
      </View>
      <Text className="text-center font-heading text-lg text-neutral-900">{title}</Text>
      {description ? (
        <Text className="text-center font-body text-sm text-neutral-500">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-2 w-full max-w-[220px]">
          <Button label={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}
