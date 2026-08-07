import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useNotifications, useMarkNotificationRead } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsScreen() {
  const navigation = useAppNavigation();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">Notifications</Text>
      </View>

      {notifications.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={notifications.data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => !item.isRead && markRead.mutate(item.id)}
              className={`mb-2 gap-1 rounded-lg p-4 ${item.isRead ? 'bg-white' : 'bg-primary-50'}`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-body-semibold text-sm text-neutral-900">{item.title}</Text>
                <Text className="font-body text-xs text-neutral-400">{timeAgo(item.createdAt)}</Text>
              </View>
              <Text className="font-body text-xs text-neutral-600">{item.body}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState icon={Bell} title="No notifications" description="We'll let you know when something changes." />
          }
        />
      )}
    </SafeAreaView>
  );
}
