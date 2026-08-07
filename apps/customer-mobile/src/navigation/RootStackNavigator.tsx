import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { CategoriesScreen } from '../screens/home/CategoriesScreen';
import { BusinessListingScreen } from '../screens/home/BusinessListingScreen';
import { BusinessDetailsScreen } from '../screens/home/BusinessDetailsScreen';
import { ProductDetailsScreen } from '../screens/home/ProductDetailsScreen';
import { CartScreen } from '../screens/home/CartScreen';
import { CheckoutScreen } from '../screens/home/CheckoutScreen';
import { PaymentScreen } from '../screens/home/PaymentScreen';
import { OrderConfirmationScreen } from '../screens/home/OrderConfirmationScreen';
import { LiveTrackingScreen } from '../screens/home/LiveTrackingScreen';
import { OrderDetailsScreen } from '../screens/orders/OrderDetailsScreen';
import { NotificationsScreen } from '../screens/home/NotificationsScreen';
import { AddressesScreen } from '../screens/profile/AddressesScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="BusinessListing" component={BusinessListingScreen} />
      <Stack.Screen name="BusinessDetails" component={BusinessDetailsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}
