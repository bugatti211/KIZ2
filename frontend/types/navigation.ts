import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  CatalogMain: undefined;
  CategoryProductsScreen: { categoryId: string; category: string };
  ProductCardScreen: { product: any };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  OfflineSalesScreen: undefined;
  ProductManagementScreen: undefined;
  NewSupply: undefined;
  SupplyHistory: undefined;
  AddEditProductScreen: { product?: any };
};

export type TabParamList = {
  AdsScreen: undefined;
  catalog: NavigatorScreenParams<RootStackParamList>;
  consult: undefined;
  cart: undefined;
  orders: undefined;
  profile: NavigatorScreenParams<ProfileStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends TabParamList {}
  }
}
