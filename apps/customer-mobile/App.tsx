import './global.css';
import { useCallback, useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts as useInterFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts as useManropeFonts, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { QueryClientProvider } from '@tanstack/react-query';
import { ApiClientProvider, useMe } from '@chirudeli/api-client';
import { apiClient } from './src/lib/apiClient';
import { queryClient } from './src/lib/queryClient';
import { useSessionStore } from './src/state/sessionStore';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

function SessionBootstrap({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);
  const setSignedIn = useSessionStore((s) => s.setSignedIn);
  const setSignedOut = useSessionStore((s) => s.setSignedOut);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const me = useMe(status === 'signedIn');
  useEffect(() => {
    if (me.data) setSignedIn(me.data);
    if (me.isError) setSignedOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.data, me.isError]);

  return <>{children}</>;
}

export default function App() {
  const [interLoaded] = useInterFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [manropeLoaded] = useManropeFonts({ Manrope_700Bold, Manrope_800ExtraBold });
  const fontsReady = interLoaded && manropeLoaded;

  const onLayout = useCallback(async () => {
    if (fontsReady) await SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider onLayout={onLayout}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={apiClient}>
          <SessionBootstrap>
            <View className="flex-1 bg-background">
              <StatusBar style="dark" />
              <RootNavigator />
            </View>
          </SessionBootstrap>
        </ApiClientProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
