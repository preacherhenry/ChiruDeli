import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

/** Every screen — whether it lives on the root stack or inside a bottom tab
 * — navigates through this so pushing "up" to a root-level screen (Cart,
 * BusinessDetails, ...) works the same way everywhere. */
export function useAppNavigation() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}

export function useAppRoute<Name extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, Name>>();
}
