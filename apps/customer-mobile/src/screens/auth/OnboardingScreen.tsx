import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UtensilsCrossed, MapPin, Clock } from 'lucide-react-native';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Logo } from '../../components/Logo';
import { useSessionStore } from '../../state/sessionStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const VALUE_PROPS = [
  { icon: UtensilsCrossed, text: 'Food, groceries, medicine and more from local Chirundu businesses' },
  { icon: Clock, text: 'Fast delivery with live order tracking' },
  { icon: MapPin, text: 'Built for Chirundu, expanding across Zambia' },
];

export function OnboardingScreen({ navigation }: Props) {
  const completeOnboarding = useSessionStore((s) => s.completeOnboarding);

  return (
    <Screen>
      <View className="flex-1 justify-between px-6 py-8">
        <View className="items-center gap-4 pt-12">
          <Logo size={64} />
          <Text className="text-center font-body text-base text-neutral-600">
            Anything You Need. Delivered.
          </Text>
        </View>

        <View className="gap-6">
          {VALUE_PROPS.map(({ icon: Icon, text }) => (
            <View key={text} className="flex-row items-center gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-50">
                <Icon size={20} color="#0E6E4E" />
              </View>
              <Text className="flex-1 font-body text-sm text-neutral-700">{text}</Text>
            </View>
          ))}
        </View>

        <View className="gap-3">
          <Button
            label="Create an account"
            onPress={() => {
              completeOnboarding();
              navigation.navigate('Register');
            }}
          />
          <Button
            label="I already have an account"
            variant="outline"
            onPress={() => {
              completeOnboarding();
              navigation.navigate('Login');
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
