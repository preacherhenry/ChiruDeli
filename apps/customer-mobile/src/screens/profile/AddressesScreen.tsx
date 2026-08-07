import { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Plus } from 'lucide-react-native';
import { useAddresses, useCreateAddress } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useLocationStore } from '../../state/locationStore';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export function AddressesScreen() {
  const navigation = useAppNavigation();
  const addresses = useAddresses();
  const createAddress = useCreateAddress();
  const { coords } = useLocationStore();

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [area, setArea] = useState('Chirundu Town');

  const onSave = () => {
    if (!line1.trim() || !coords) return;
    createAddress.mutate(
      { label, line1, area, latitude: coords.latitude, longitude: coords.longitude, isDefault: (addresses.data?.length ?? 0) === 0 },
      { onSuccess: () => { setAdding(false); setLine1(''); } },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">Addresses</Text>
      </View>

      {adding ? (
        <View className="mx-4 mb-4 gap-2 rounded-lg border border-neutral-200 bg-white p-3">
          <TextInput value={label} onChangeText={setLabel} placeholder="Label (e.g. Home)" className="font-body text-sm text-neutral-900" />
          <TextInput
            value={line1}
            onChangeText={setLine1}
            placeholder="Street / plot number"
            className="border-t border-neutral-100 pt-2 font-body text-sm text-neutral-900"
          />
          <TextInput
            value={area}
            onChangeText={setArea}
            placeholder="Area (e.g. Chirundu Town)"
            className="border-t border-neutral-100 pt-2 font-body text-sm text-neutral-900"
          />
          <View className="flex-row gap-2 pt-2">
            <View className="flex-1">
              <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <Button label="Save" onPress={onSave} loading={createAddress.isPending} />
            </View>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setAdding(true)} className="mx-4 mb-4 flex-row items-center gap-2">
          <Plus size={16} color="#0E6E4E" />
          <Text className="font-body-medium text-sm text-primary-600">Add new address</Text>
        </Pressable>
      )}

      {addresses.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={addresses.data ?? []}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <View className="mb-2 flex-row items-center gap-3 rounded-lg bg-white p-4">
              <MapPin size={18} color="#767B72" />
              <View className="flex-1">
                <Text className="font-body-semibold text-sm text-neutral-900">
                  {item.label} {item.isDefault ? '· Default' : ''}
                </Text>
                <Text className="font-body text-xs text-neutral-500">
                  {item.line1}, {item.area}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon={MapPin} title="No saved addresses" description="Add an address to speed up checkout." />
          }
        />
      )}
    </SafeAreaView>
  );
}

