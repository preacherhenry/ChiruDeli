import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSessionStore } from '../state/sessionStore';
import { useLocationStore } from '../state/locationStore';
import { AuthNavigator } from './AuthNavigator';
import { RootStackNavigator } from './RootStackNavigator';
import { LocationPermissionScreen } from '../screens/auth/LocationPermissionScreen';
import { LoadingState } from '../components/LoadingState';
import { Logo } from '../components/Logo';

function SplashView() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background">
      <Logo size={56} />
      <LoadingState label="" />
    </View>
  );
}

export function RootNavigator() {
  const status = useSessionStore((s) => s.status);
  const permissionAsked = useLocationStore((s) => s.permissionAsked);

  return (
    <NavigationContainer>
      {status === 'loading' ? (
        <SplashView />
      ) : status === 'signedOut' ? (
        <AuthNavigator />
      ) : !permissionAsked ? (
        <LocationPermissionScreen />
      ) : (
        <RootStackNavigator />
      )}
    </NavigationContainer>
  );
}
