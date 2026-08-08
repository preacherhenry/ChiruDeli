import { View, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Bell, HelpCircle, Store, LogOut, ChevronRight, User } from 'lucide-react-native';
import { useLogout } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useSessionStore } from '../../state/sessionStore';
import { BUSINESS_WEB_URL } from '../../lib/apiClient';

const MENU = [
  { icon: MapPin, label: 'Addresses', route: 'Addresses' as const },
  { icon: Bell, label: 'Notifications', route: 'Notifications' as const },
  { icon: HelpCircle, label: 'Help & Support', route: 'HelpSupport' as const },
];

export function ProfileScreen() {
  const navigation = useAppNavigation();
  const user = useSessionStore((s) => s.user);
  const setSignedOut = useSessionStore((s) => s.setSignedOut);
  const logout = useLogout();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="font-heading text-xl text-neutral-900">Profile</Text>
      </View>

      <View className="mx-4 mb-6 flex-row items-center gap-4 rounded-lg bg-white p-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-50">
          <User size={24} color="#0E6E4E" />
        </View>
        <View>
          <Text className="font-heading text-base text-neutral-900">{user?.fullName ?? 'ChiruDeli Customer'}</Text>
          <Text className="font-body text-sm text-neutral-500">{user?.phone}</Text>
        </View>
      </View>

      <View className="mx-4 gap-1 rounded-lg bg-white">
        {MENU.map(({ icon: Icon, label, route }, index) => (
          <Pressable
            key={label}
            onPress={() => navigation.navigate(route)}
            className={`flex-row items-center gap-3 px-4 py-4 ${index > 0 ? 'border-t border-neutral-100' : ''}`}
          >
            <Icon size={18} color="#767B72" />
            <Text className="flex-1 font-body text-sm text-neutral-900">{label}</Text>
            <ChevronRight size={16} color="#C3C7BF" />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => Linking.openURL(`${BUSINESS_WEB_URL}/register`)}
        className="mx-4 mt-6 flex-row items-center gap-3 rounded-lg bg-white px-4 py-4"
      >
        <Store size={18} color="#0E6E4E" />
        <View className="flex-1">
          <Text className="font-body-semibold text-sm text-neutral-900">Register your store</Text>
          <Text className="font-body text-xs text-neutral-500">Start selling and reaching customers through ChiruDeli</Text>
        </View>
        <ChevronRight size={16} color="#C3C7BF" />
      </Pressable>

      <Pressable
        onPress={() => logout.mutate(undefined, { onSuccess: setSignedOut })}
        className="mx-4 mt-6 flex-row items-center justify-center gap-2 rounded-lg border border-error/30 py-4"
      >
        <LogOut size={16} color="#D64545" />
        <Text className="font-body-semibold text-sm text-error">Log out</Text>
      </Pressable>
    </SafeAreaView>
  );
}
