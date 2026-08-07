import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useRequestOtp, useVerifyOtp } from '@chirudeli/api-client';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { useSessionStore } from '../../state/sessionStore';

export function OtpLoginScreen() {
  const [phone, setPhone] = useState('+260');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const setSignedIn = useSessionStore((s) => s.setSignedIn);

  const onRequest = () => {
    setError(null);
    requestOtp.mutate(
      { phone },
      {
        onSuccess: (res) => {
          setStep('code');
          setDevCode(res.devCode ?? null);
        },
        onError: (err) => setError(err instanceof Error ? err.message : 'Could not send code.'),
      },
    );
  };

  const onVerify = () => {
    setError(null);
    verifyOtp.mutate(
      { phone, code },
      {
        onSuccess: (res) => setSignedIn(res.user),
        onError: (err) => setError(err instanceof Error ? err.message : 'Invalid code.'),
      },
    );
  };

  return (
    <Screen scroll>
      <View className="flex-1 justify-center gap-6 px-6 py-10">
        <View className="gap-1">
          <Text className="font-heading text-xl text-neutral-900">Log in with a code</Text>
          <Text className="font-body text-sm text-neutral-500">
            {step === 'phone'
              ? "We'll text a 6-digit code to your phone."
              : `Enter the code sent to ${phone}.`}
          </Text>
        </View>

        {step === 'phone' ? (
          <View className="gap-4">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+260971234567"
              className="min-h-[52px] rounded-lg border border-neutral-200 bg-white px-4 font-body text-base text-neutral-900"
            />
            {error ? <Text className="font-body text-sm text-error">{error}</Text> : null}
            <Button label="Send code" onPress={onRequest} loading={requestOtp.isPending} />
          </View>
        ) : (
          <View className="gap-4">
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              className="min-h-[52px] rounded-lg border border-neutral-200 bg-white px-4 text-center font-body text-lg tracking-[8px] text-neutral-900"
            />
            {devCode ? (
              <Text className="text-center font-body text-xs text-neutral-400">
                Dev mode — your code is {devCode}
              </Text>
            ) : null}
            {error ? <Text className="font-body text-sm text-error">{error}</Text> : null}
            <Button label="Verify & continue" onPress={onVerify} loading={verifyOtp.isPending} />
            <Button label="Use a different number" variant="ghost" onPress={() => setStep('phone')} />
          </View>
        )}
      </View>
    </Screen>
  );
}
