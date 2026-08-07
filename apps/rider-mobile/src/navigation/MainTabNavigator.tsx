import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Wallet, History, User } from 'lucide-react-native';
import type { MainTabParamList } from './types';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { EarningsScreen } from '../screens/dashboard/EarningsScreen';
import { HistoryScreen } from '../screens/dashboard/HistoryScreen';
import { ProfileScreen } from '../screens/dashboard/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0E6E4E',
        tabBarInactiveTintColor: '#9BA097',
        tabBarStyle: { borderTopColor: '#EEF0ED' },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{ title: 'Earnings', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{ title: 'History', tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
