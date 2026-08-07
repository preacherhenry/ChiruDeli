import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { Button } from '../../components/Button';

export function DeliveryConfirmationScreen() {
  const navigation = useAppNavigation();
  const [pin, setPin] = useState('');

  const onComplete = () => {
    if (pin.length !== 4) {
      Alert.alert('Enter the 4-digit PIN', 'Ask the customer for the delivery PIN shown on their tracking screen.');
      return;
    }
    Alert.alert('Delivery complete!', 'K35 added to your earnings.', [
      { text: 'OK', onPress: () => navigation.replace('Tabs') },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <CheckCircle2 size={32} color="#0E6E4E" />
        </View>
        <Text className="text-center font-heading text-xl text-neutral-900">Confirm delivery</Text>
        <Text className="text-center font-body text-sm text-neutral-500">
          Ask the customer for their 4-digit delivery PIN to complete this order.
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="0000"
          className="min-h-[56px] w-40 rounded-lg border border-neutral-200 bg-white text-center font-heading text-2xl tracking-[10px] text-neutral-900"
        />
        <View className="w-full pt-4">
          <Button label="Complete Delivery" onPress={onComplete} />
        </View>
      </View>
    </SafeAreaView>
  );
}
