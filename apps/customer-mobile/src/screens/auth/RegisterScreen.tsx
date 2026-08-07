import { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRegisterCustomer } from '@chirudeli/api-client';
import { registerCustomerSchema } from '@chirudeli/shared-types';
import type { AuthStackParamList } from '../../navigation/types';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { useSessionStore } from '../../state/sessionStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+260');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const register = useRegisterCustomer();
  const setSignedIn = useSessionStore((s) => s.setSignedIn);

  const onSubmit = () => {
    const parsed = registerCustomerSchema.safeParse({ fullName, phone, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details.');
      return;
    }
    setError(null);
    register.mutate(parsed.data, {
      onSuccess: (res) => setSignedIn(res.user),
      onError: (err) => setError(err instanceof Error ? err.message : 'Could not create your account.'),
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <Screen scroll>
        <View className="flex-1 justify-center gap-6 px-6 py-10">
          <View className="items-center gap-2">
            <Logo size={48} />
            <Text className="font-body text-sm text-neutral-500">Create your ChiruDeli account</Text>
          </View>

          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="font-body-medium text-sm text-neutral-700">Full name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Mwansa Phiri"
                className="min-h-[52px] rounded-lg border border-neutral-200 bg-white px-4 font-body text-base text-neutral-900"
              />
            </View>
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
                placeholder="At least 8 characters"
                className="min-h-[52px] rounded-lg border border-neutral-200 bg-white px-4 font-body text-base text-neutral-900"
              />
            </View>
            {error ? <Text className="font-body text-sm text-error">{error}</Text> : null}
          </View>

          <Button label="Create account" onPress={onSubmit} loading={register.isPending} />

          <View className="flex-row justify-center gap-1">
            <Text className="font-body text-sm text-neutral-500">Already have an account?</Text>
            <Text
              className="font-body-semibold text-sm text-primary-600"
              onPress={() => navigation.navigate('Login')}
            >
              Log in
            </Text>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
