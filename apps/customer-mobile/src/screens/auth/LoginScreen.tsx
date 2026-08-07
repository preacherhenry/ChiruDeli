import { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLogin } from '@chirudeli/api-client';
import { loginSchema } from '@chirudeli/shared-types';
import type { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { useSessionStore } from '../../state/sessionStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('+260');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();
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
      onError: (err) => setError(err instanceof Error ? err.message : 'Login failed.'),
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <Screen scroll>
        <View className="flex-1 justify-center gap-6 px-6 py-10">
          <View className="items-center gap-2">
            <Logo size={48} />
            <Text className="font-body text-sm text-neutral-500">Log in to continue ordering</Text>
          </View>

          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="font-body-medium text-sm text-neutral-700">Phone number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+260971234567"
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
          <Button label="Log in with a one-time code" variant="ghost" onPress={() => navigation.navigate('OtpLogin')} />

          <View className="flex-row justify-center gap-1">
            <Text className="font-body text-sm text-neutral-500">Don't have an account?</Text>
            <Text
              className="font-body-semibold text-sm text-primary-600"
              onPress={() => navigation.navigate('Register')}
            >
              Sign up
            </Text>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
