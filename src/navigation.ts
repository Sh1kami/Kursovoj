import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabRoutes = { Home: undefined; Catalog: undefined; Categories: undefined; Data: undefined };
export type RootRoutes = {
  Tabs: NavigatorScreenParams<TabRoutes> | undefined;
  Details: { id: number };
  Favorites: undefined;
  Photo: { id: number };
  ItemForm: { id?: number };
  CategoryForm: { id?: number };
};
