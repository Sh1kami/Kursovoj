import { NavigationContainer, type Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Action, Empty, Icon, Label, Loading, layout } from './src/components/ui';
import { InventoryContext, useInventoryStore } from './src/hooks/useInventory';
import type { RootRoutes, TabRoutes } from './src/navigation';
import { Catalog } from './src/screens/Catalog';
import { Categories } from './src/screens/Categories';
import { CategoryForm } from './src/screens/CategoryForm';
import { Details } from './src/screens/Details';
import { Home } from './src/screens/Home';
import { ItemForm } from './src/screens/ItemForm';
import { navigationTheme, Palette, paletteFor, usePalette } from './src/theme';

const Root = createNativeStackNavigator<RootRoutes>();
const Tabs = createBottomTabNavigator<TabRoutes>();
const Section = createNativeStackNavigator();
const largeTitle: NativeStackNavigationOptions = {
  headerLargeTitle: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
};
const tabInfo = {
  Home: { title: 'Огляд', icon: 'house', active: 'house.fill' },
  Catalog: { title: 'Каталог', icon: 'archivebox', active: 'archivebox.fill' },
  Categories: { title: 'Категорії', icon: 'tag', active: 'tag.fill' },
} as const;

function HomeSection() {
  return <Section.Navigator screenOptions={largeTitle}>
    <Section.Screen name="HomeContent" component={Home} options={{ title: 'Особисті речі' }} />
  </Section.Navigator>;
}

function CatalogSection() {
  return <Section.Navigator screenOptions={largeTitle}>
    <Section.Screen name="CatalogContent" component={Catalog} options={{ title: 'Каталог' }} />
  </Section.Navigator>;
}

function CategoriesSection() {
  return <Section.Navigator screenOptions={largeTitle}>
    <Section.Screen name="CategoriesContent" component={Categories} options={{ title: 'Категорії' }} />
  </Section.Navigator>;
}

function InventoryTabs() {
  return (
    <Tabs.Navigator screenOptions={({ route }) => {
      const tab = tabInfo[route.name];
      return {
        title: tab.title, headerShown: false,
        tabBarIcon: ({ color, focused, size }) => <Icon color={color} size={size}
          name={focused ? tab.active : tab.icon} />,
      };
    }}>
      <Tabs.Screen name="Home" component={HomeSection} />
      <Tabs.Screen name="Catalog" component={CatalogSection} />
      <Tabs.Screen name="Categories" component={CategoriesSection} />
    </Tabs.Navigator>
  );
}

function Cancel({ onPress }: { onPress: () => void }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.cancel, { opacity: pressed ? 0.55 : 1 }]}>
    <Label style={{ color: p.accent }}>Скасувати</Label>
  </Pressable>;
}

function InventoryNavigation({ theme }: { theme: Theme }) {
  const { snapshot, loadError, retry, busy, change } = useInventoryStore();

  if (!snapshot || loadError) {
    return <SafeAreaView style={styles.loading}>
      {loadError
        ? <View style={layout.centered}>
            <Empty title="Каталог недоступний" detail="Спробуйте знову відкрити локальне сховище." icon="exclamationmark.circle">
              <Action title="Повторити" action={retry} tone="primary" />
            </Empty>
          </View>
        : <Loading />}
    </SafeAreaView>;
  }

  return (
    <InventoryContext.Provider value={{ ...snapshot, busy, change }}>
      <NavigationContainer theme={theme}>
        <Root.Navigator screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerTintColor: theme.colors.primary }}>
          <Root.Screen name="Tabs" component={InventoryTabs} options={{ headerShown: false }} />
          <Root.Screen name="Details" component={Details} options={{ title: 'Про річ' }} />
          <Root.Group screenOptions={({ navigation }) => ({
            presentation: 'modal',
            gestureEnabled: !busy,
            headerLeft: () => <Cancel onPress={() => { if (!busy) navigation.goBack(); }} />,
          })}>
            <Root.Screen name="ItemForm" component={ItemForm}
              options={({ route }) => ({ title: route.params.id === undefined ? 'Додати річ' : 'Редагувати річ' })} />
            <Root.Screen name="CategoryForm" component={CategoryForm}
              options={({ route }) => ({ title: route.params.id === undefined ? 'Нова категорія' : 'Редагувати категорію' })} />
          </Root.Group>
        </Root.Navigator>
      </NavigationContainer>
    </InventoryContext.Provider>
  );
}

export default function App() {
  const dark = useColorScheme() === 'dark';
  const palette = paletteFor(dark);
  return (
    <SafeAreaProvider style={{ backgroundColor: palette.background }}>
      <Palette.Provider value={palette}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <InventoryNavigation theme={navigationTheme(dark)} />
      </Palette.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  cancel: { minHeight: 44, justifyContent: 'center' },
});
