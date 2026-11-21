import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabRoutes = { Home: undefined; Catalog: undefined; Categories: undefined };
export type RootRoutes = {
  Tabs: NavigatorScreenParams<TabRoutes> | undefined;
  Details: { id: number };
  ItemForm: { id?: number };
  CategoryForm: { id?: number };
};
