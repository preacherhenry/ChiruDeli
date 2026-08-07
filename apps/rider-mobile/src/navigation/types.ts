export type AuthStackParamList = {
  Login: undefined;
  Registration: undefined;
  DocumentUpload: undefined;
  ApprovalPending: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  EarningsTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  DeliveryRequest: { deliveryId: string };
  PickupNavigation: { deliveryId: string };
  PickupConfirmation: { deliveryId: string };
  DeliveryNavigation: { deliveryId: string };
  DeliveryConfirmation: { deliveryId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
