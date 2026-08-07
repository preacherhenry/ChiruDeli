import { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLoginRider, ApiError } from '@chirudeli/api-client';
import { loginSchema } from '@chirudeli/shared-types';
import type { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { useSessionStore } from '../../state/sessionStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('+260975000001');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const login = useLoginRider();
  const setSignedIn = useSessionStore((s) => s.setSignedIn);

  const onSubmit = () => {
    const parsed = loginSchema.safeParse({ phone, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your phone number and password.');
      return;
    }
    setError(null);
    login.mutate(parsed.data, {
      onSuccess: (res) => setSignedIn(res.user),
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Login failed.'),
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center gap-6 px-6">
          <View className="items-center gap-2">
            <Logo size={44} />
            <Text className="font-body text-sm text-neutral-500">Log in to start delivering</Text>
          </View>

          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="font-body-medium text-sm text-neutral-700">Phone number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                className="min-h-[52px] rounded-lg border border-neutral-200 bg-white px-4 font-body text-base text-neutral-900"
              />
            </View>
            <View className="gap-1.5">
              <Text className="font-body-medium text-sm text-neutral-700">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                className="min-h-[52px] rounded-lg border border-neutral-200 bg-white px-4 font-body text-base text-neutral-900"
              />
            </View>
            {error ? <Text className="font-body text-sm text-error">{error}</Text> : null}
          </View>

          <Button label="Log in" onPress={onSubmit} loading={login.isPending} />

          <View className="flex-row justify-center gap-1">
            <Text className="font-body text-sm text-neutral-500">New rider?</Text>
            <Text
              className="font-body-semibold text-sm text-primary-600"
              onPress={() => navigation.navigate('Registration')}
            >
              Apply to ride
            </Text>
          </View>

          <Text className="text-center font-body text-xs text-neutral-400">
            Demo login: +260975000001 / Rider123!
          </Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
