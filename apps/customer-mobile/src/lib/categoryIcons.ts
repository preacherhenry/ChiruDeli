import {
  Utensils,
  ShoppingCart,
  Pill,
  Smartphone,
  BookOpen,
  Home,
  Shirt,
  Package,
  type LucideIcon,
} from 'lucide-react-native';
import type { BusinessCategorySlug } from '@chirudeli/shared-types';

export const CATEGORY_ICONS: Record<BusinessCategorySlug, LucideIcon> = {
  FOOD: Utensils,
  GROCERIES: ShoppingCart,
  PHARMACY: Pill,
  ELECTRONICS: Smartphone,
  STATIONERY: BookOpen,
  HOUSEHOLD: Home,
  CLOTHING: Shirt,
  OTHER: Package,
};
