export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  OtpLogin: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  OrdersTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Categories: undefined;
  BusinessListing: { categorySlug?: string; searchQuery?: string };
  BusinessDetails: { businessId: string };
  ProductDetails: { businessId: string; productId: string };
  Cart: undefined;
  Checkout: undefined;
  Payment: {
    addressId: string;
    deliveryInstructions?: string;
    paymentMethod: 'MOBILE_MONEY' | 'CARD';
    promoCode?: string;
    idempotencyKey: string;
    total: number;
  };
  OrderConfirmation: { orderId: string };
  LiveTracking: { orderId: string };
  Orders: undefined;
  OrderDetails: { orderId: string };
  Favorites: undefined;
  Notifications: undefined;
  Profile: undefined;
  Addresses: undefined;
  HelpSupport: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
