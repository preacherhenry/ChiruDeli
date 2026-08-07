import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSessionStore } from '../state/sessionStore';
import { AuthNavigator } from './AuthNavigator';
import { RootStackNavigator } from './RootStackNavigator';
import { Logo } from '../components/Logo';

function SplashView() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Logo size={48} />
    </View>
  );
}

export function RootNavigator() {
  const status = useSessionStore((s) => s.status);

  return (
    <NavigationContainer>
      {status === 'loading' ? <SplashView /> : status === 'signedOut' ? <AuthNavigator /> : <RootStackNavigator />}
    </NavigationContainer>
  );
}
