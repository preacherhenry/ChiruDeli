import { View, Text } from 'react-native';
import { AlertTriangle, MapPinOff } from 'lucide-react-native';
import { ApiError } from '@chirudeli/api-client';
import { Button } from './Button';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const isOutsideServiceArea = error instanceof ApiError && error.isOutsideServiceArea;
  const message =
    error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-error/10">
        {isOutsideServiceArea ? (
          <MapPinOff color="#D64545" size={28} />
        ) : (
          <AlertTriangle color="#D64545" size={28} />
        )}
      </View>
      <Text className="text-center font-heading text-lg text-neutral-900">
        {isOutsideServiceArea ? 'Outside our delivery area' : 'Something went wrong'}
      </Text>
      <Text className="text-center font-body text-sm text-neutral-500">{message}</Text>
      {onRetry ? (
        <View className="mt-2 w-full max-w-[220px]">
          <Button label="Try again" onPress={onRetry} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}
