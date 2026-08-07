import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { DeliveryRequestScreen } from '../screens/delivery/DeliveryRequestScreen';
import { PickupNavigationScreen } from '../screens/delivery/PickupNavigationScreen';
import { PickupConfirmationScreen } from '../screens/delivery/PickupConfirmationScreen';
import { DeliveryNavigationScreen } from '../screens/delivery/DeliveryNavigationScreen';
import { DeliveryConfirmationScreen } from '../screens/delivery/DeliveryConfirmationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="DeliveryRequest" component={DeliveryRequestScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PickupNavigation" component={PickupNavigationScreen} />
      <Stack.Screen name="PickupConfirmation" component={PickupConfirmationScreen} />
      <Stack.Screen name="DeliveryNavigation" component={DeliveryNavigationScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmationScreen} />
    </Stack.Navigator>
  );
}
