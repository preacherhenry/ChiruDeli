import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Upload, FileCheck, IdCard, Car, User } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'DocumentUpload'>;

const DOCUMENTS = [
  { key: 'nrc', label: 'National ID (NRC)', icon: IdCard },
  { key: 'license', label: "Driver's license", icon: FileCheck },
  { key: 'vehicle', label: 'Vehicle registration', icon: Car },
  { key: 'photo', label: 'Profile photo', icon: User },
];

export function DocumentUploadScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">Upload documents</Text>
      </View>

      <View className="flex-1 gap-3 px-4">
        <Text className="mb-1 font-body text-sm text-neutral-500">
          We securely store these for admin review — clear photos speed up approval.
        </Text>
        {DOCUMENTS.map(({ key, label, icon: Icon }) => (
          <Pressable
            key={key}
            className="flex-row items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50">
              <Icon size={18} color="#0E6E4E" />
            </View>
            <Text className="flex-1 font-body text-sm text-neutral-800">{label}</Text>
            <Upload size={18} color="#767B72" />
          </Pressable>
        ))}
      </View>

      <View className="border-t border-neutral-100 px-4 py-3">
        <Button label="Submit for review" onPress={() => navigation.navigate('ApprovalPending')} />
      </View>
    </SafeAreaView>
  );
}
