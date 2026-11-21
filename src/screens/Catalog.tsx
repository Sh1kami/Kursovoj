import { useState } from 'react';
import { ActionSheetIOS, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Action, Chip, Empty, Group, Icon, ItemRow, Label, Muted, layout } from '../components/ui';
import { filterItems, normalizeName, type ItemSort } from '../domain';
import { useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';
import { usePalette } from '../theme';

const sortOptions: { key: ItemSort; label: string }[] = [
  { key: 'newest', label: 'Спочатку нові' },
  { key: 'name', label: 'За назвою' },
  { key: 'location', label: 'За місцем' },
];

export function Catalog({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const { items, categories } = useInventory();
  const nav = useNavigation<NativeStackNavigationProp<RootRoutes>>();
  const p = usePalette();
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<number | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [includeOnlyFavorites, setIncludeOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<ItemSort>('newest');
  const category = categories.find(row => row.id === selection);
  const categoryId = category?.id ?? null;
  const visible = filterItems(items, query, categoryId, favoritesOnly || includeOnlyFavorites, sort);
  const filtered = Boolean(normalizeName(query)) || categoryId !== null || includeOnlyFavorites;
  const sortLabel = sortOptions.find(option => option.key === sort)?.label ?? sortOptions[0].label;

  function reset() {
    setQuery('');
    setSelection(null);
    setIncludeOnlyFavorites(false);
  }

  function pickSort() {
    ActionSheetIOS.showActionSheetWithOptions({
      title: 'Сортувати речі',
      options: [...sortOptions.map(option => option.label), 'Скасувати'],
      cancelButtonIndex: sortOptions.length,
    }, index => {
      const option = sortOptions[index];
      if (option) setSort(option.key);
    });
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={item => String(item.id)}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={[layout.stack, styles.filters]}>
          <View style={[styles.search, { backgroundColor: p.surface, borderColor: p.line }]}>
            <Icon name="magnifyingglass" color={p.muted} />
            <TextInput accessibilityLabel="Пошук за назвою або місцем" placeholder="Назва або місце"
              value={query} onChangeText={setQuery} clearButtonMode="while-editing" returnKeyType="search"
              autoCorrect={false} placeholderTextColor={p.muted} selectionColor={p.accent}
              style={[styles.input, { color: p.text }]} />
          </View>
          <View style={layout.wrap}>
            {categories.length > 0 && <Pressable accessibilityRole="button"
              accessibilityState={{ expanded: showCategories }}
              accessibilityLabel={'Категорії: ' + (category?.name ?? 'усі')}
              onPress={() => setShowCategories(current => !current)}
              style={({ pressed }) => [styles.control, { backgroundColor: pressed || category ? p.tint : p.surface, borderColor: p.line }]}>
              <Icon name="line.3.horizontal.decrease" size={15} />
              <Label style={[styles.controlLabel, { color: p.accent }]}>{category?.name ?? 'Категорії'}</Label>
            </Pressable>}
            <Pressable accessibilityRole="button" accessibilityLabel={'Сортування: ' + sortLabel}
              onPress={pickSort} style={({ pressed }) => [styles.control, { backgroundColor: pressed ? p.tint : p.surface, borderColor: p.line }]}>
              <Icon name="arrow.up.arrow.down" size={14} />
              <Label style={[styles.controlLabel, { color: p.accent }]}>{sortLabel}</Label>
            </Pressable>
            {!favoritesOnly && <Chip title="Обране" selected={includeOnlyFavorites}
              onPress={() => setIncludeOnlyFavorites(value => !value)} />}
          </View>
          {showCategories && categories.length > 0 && (
            <View style={layout.wrap}>
              <Chip title="Усі категорії" selected={categoryId === null} onPress={() => { setSelection(null); setShowCategories(false); }} />
              {categories.map(category => <Chip key={category.id} title={category.name}
                selected={categoryId === category.id} onPress={() => { setSelection(category.id); setShowCategories(false); }} />)}
            </View>
          )}
          <Muted accessibilityLiveRegion="polite">Знайдено: {visible.length}</Muted>
        </View>
      }
      ListEmptyComponent={
        <Group>
          {filtered
            ? <Empty title="Нічого не знайдено" detail="Змініть запит або виберіть іншу категорію." icon="magnifyingglass">
                <Action title="Скинути пошук і фільтр" action={reset} />
              </Empty>
            : favoritesOnly
              ? <Empty title="В обраному ще нічого немає" detail="Позначте річ зірочкою в її картці." icon="star" />
              : <Empty title="У каталозі немає речей" detail="Створіть запис із назвою та категорією." icon="archivebox">
                <Action title="Додати річ" action={() => nav.navigate('ItemForm', {})} icon="plus" />
              </Empty>}
        </Group>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => <Group>
        <ItemRow item={item} divided={false} onPress={() => nav.navigate('Details', { id: item.id })} />
      </Group>}
    />
  );
}

export function Favorites() {
  return <Catalog favoritesOnly />;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, width: '100%', maxWidth: 640, alignSelf: 'center' },
  filters: { marginBottom: 14 },
  search: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderRadius: 12, gap: 8,
    borderWidth: StyleSheet.hairlineWidth, minHeight: 52,
  },
  input: { flex: 1, minHeight: 48, paddingVertical: 10, fontSize: 17 },
  control: {
    minHeight: 44, maxWidth: '100%', borderWidth: StyleSheet.hairlineWidth, borderRadius: 22,
    paddingHorizontal: 13, paddingVertical: 8, gap: 6, flexDirection: 'row', alignItems: 'center',
  },
  controlLabel: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  separator: { height: 7 },
});
