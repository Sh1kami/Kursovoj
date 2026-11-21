import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Action, Chip, Empty, Group, Icon, ItemRow, Muted, layout } from '../components/ui';
import { filterItems, normalizeName } from '../domain';
import { useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';
import { usePalette } from '../theme';

export function Catalog() {
  const { items, categories } = useInventory();
  const nav = useNavigation<NativeStackNavigationProp<RootRoutes>>();
  const p = usePalette();
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<number | null>(null);
  const categoryId = categories.some(category => category.id === selection) ? selection : null;
  const visible = filterItems(items, query, categoryId);
  const filtered = Boolean(normalizeName(query)) || categoryId !== null;

  function reset() {
    setQuery('');
    setSelection(null);
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
            <TextInput accessibilityLabel="Пошук за назвою" placeholder="Пошук за назвою"
              value={query} onChangeText={setQuery} clearButtonMode="while-editing" returnKeyType="search"
              autoCorrect={false} placeholderTextColor={p.muted} selectionColor={p.accent}
              style={[styles.input, { color: p.text }]} />
          </View>
          {categories.length > 0 && (
            <View style={layout.wrap}>
              <Chip title="Усі категорії" selected={categoryId === null} onPress={() => setSelection(null)} />
              {categories.map(category => <Chip key={category.id} title={category.name}
                selected={categoryId === category.id} onPress={() => setSelection(category.id)} />)}
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

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, width: '100%', maxWidth: 640, alignSelf: 'center' },
  filters: { marginBottom: 14 },
  search: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderRadius: 12, gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, minHeight: 48, paddingVertical: 10, fontSize: 17 },
  separator: { height: 7 },
});
