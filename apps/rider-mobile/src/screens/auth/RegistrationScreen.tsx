import { useState, type ComponentProps } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bike } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'Registration'>;

const VEHICLE_TYPES = ['BICYCLE', 'MOTORCYCLE', 'CAR', 'ON_FOOT'] as const;

function Field({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) {
  return (
    <View className="gap-1.5">
      <Text className="font-body-medium text-sm text-neutral-700">{label}</Text>
      <TextInput
        className="min-h-[52px] rounded-lg border border-neutral-200 bg-white px-4 font-body text-base text-neutral-900"
        {...props}
      />
    </View>
  );
}

/**
 * Placeholder form — rider self-registration isn't wired to a real endpoint
 * yet (see docs/roadmap.md, "Rider app backend"). Submitting walks the real
 * navigation flow (Registration → DocumentUpload → ApprovalPending) so the
 * screen sequence matches the spec even before the backend exists.
 */
export function RegistrationScreen({ navigation }: Props) {
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]>('MOTORCYCLE');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">Rider application</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Field label="Full name" placeholder="e.g. Kunda Banda" />
        <Field label="Phone number" placeholder="+260971234567" keyboardType="phone-pad" />
        <Field label="National ID (NRC)" placeholder="123456/78/9" />
        <Field label="Home address" placeholder="Plot / street, Chirundu" />

        <View className="gap-1.5">
          <Text className="font-body-medium text-sm text-neutral-700">Vehicle type</Text>
          <View className="flex-row flex-wrap gap-2">
            {VEHICLE_TYPES.map((v) => (
              <Pressable
                key={v}
                onPress={() => setVehicleType(v)}
                className={`flex-row items-center gap-2 rounded-pill border px-4 py-2 ${vehicleType === v ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white'}`}
              >
                <Bike size={14} color={vehicleType === v ? '#0E6E4E' : '#767B72'} />
                <Text className="font-body text-xs text-neutral-800">{v.replace('_', ' ')}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Field label="Vehicle registration number" placeholder="Optional for bicycles" />
        <Field label="Driver's license number" placeholder="Optional for bicycles" />
        <Field label="Emergency contact name" placeholder="Next of kin" />
        <Field label="Emergency contact phone" placeholder="+260..." keyboardType="phone-pad" />
        <Field label="Mobile money number for payouts" placeholder="+260..." keyboardType="phone-pad" />
      </ScrollView>

      <View className="border-t border-neutral-100 px-4 py-3">
        <Button label="Continue" onPress={() => navigation.navigate('DocumentUpload')} />
      </View>
    </SafeAreaView>
  );
}
