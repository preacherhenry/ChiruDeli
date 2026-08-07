import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock3 } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { useSessionStore } from '../../state/sessionStore';

export function ApprovalPendingScreen() {
  const setSignedOut = useSessionStore((s) => s.setSignedOut);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-secondary-50">
          <Clock3 size={32} color="#DB8B1A" />
        </View>
        <Text className="text-center font-heading text-xl text-neutral-900">
          Your application is under review
        </Text>
        <Text className="text-center font-body text-sm text-neutral-500">
          ChiruDeli admin is reviewing your documents. This usually takes 1-2 business days —
          we'll notify you as soon as you're approved to start accepting deliveries.
        </Text>
        <View className="w-full pt-4">
          <Button label="Log out" variant="ghost" onPress={setSignedOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}
