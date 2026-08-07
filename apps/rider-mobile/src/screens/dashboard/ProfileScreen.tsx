import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Star, LogOut, User } from 'lucide-react-native';
import { useLogout } from '@chirudeli/api-client';
import { useSessionStore } from '../../state/sessionStore';

export function ProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const setSignedOut = useSessionStore((s) => s.setSignedOut);
  const logout = useLogout();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="font-heading text-xl text-neutral-900">Profile</Text>
      </View>

      <View className="mx-4 mb-4 flex-row items-center gap-4 rounded-lg bg-white p-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-50">
          <User size={24} color="#0E6E4E" />
        </View>
        <View>
          <Text className="font-heading text-base text-neutral-900">{user?.fullName ?? 'ChiruDeli Rider'}</Text>
          <Text className="font-body text-sm text-neutral-500">{user?.phone}</Text>
        </View>
      </View>

      <View className="mx-4 mb-4 flex-row gap-3">
        <View className="flex-1 items-center gap-1 rounded-lg bg-white p-4">
          <Bike size={18} color="#0E6E4E" />
          <Text className="font-body text-xs text-neutral-500">Motorcycle</Text>
        </View>
        <View className="flex-1 items-center gap-1 rounded-lg bg-white p-4">
          <Star size={18} color="#DB8B1A" />
          <Text className="font-body text-xs text-neutral-500">4.8 rating</Text>
        </View>
      </View>

      <Pressable
        onPress={() => logout.mutate(undefined, { onSuccess: setSignedOut })}
        className="mx-4 mt-2 flex-row items-center justify-center gap-2 rounded-lg border border-error/30 py-4"
      >
        <LogOut size={16} color="#D64545" />
        <Text className="font-body-semibold text-sm text-error">Log out</Text>
      </Pressable>
    </SafeAreaView>
  );
}
