import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Action, Empty, Group, Icon, Label, Muted, Page, layout } from '../components/ui';
import { useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';
import { usePalette } from '../theme';

export function Categories() {
  const nav = useNavigation<NativeStackNavigationProp<RootRoutes>>();
  const { categories, busy } = useInventory();
  const p = usePalette();

  return (
    <Page>
      <Group>
        {categories.length ? categories.map((category, index) => (
          <Pressable key={category.id} accessibilityRole="button"
            accessibilityLabel={category.name + ', речей: ' + category.itemCount}
            accessibilityHint="Відкриває редагування категорії"
            onPress={() => nav.navigate('CategoryForm', { id: category.id })}
            style={({ pressed }) => [
              styles.row, { borderColor: p.line, backgroundColor: pressed ? p.tint : p.surface },
              index < categories.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth },
            ]}>
            <Icon name="tag" />
            <View style={layout.grow}>
              <Label style={{ fontWeight: '600' }}>{category.name}</Label>
              <Muted>Речей: {category.itemCount}</Muted>
            </View>
            <Icon name="chevron.right" size={12} color={p.muted} />
          </Pressable>
        )) : <Empty title="Категорій ще немає" detail="Створіть категорію, щоб зберігати речі." icon="tag" />}
      </Group>
      <Action title="Нова категорія" action={() => nav.navigate('CategoryForm', {})} tone="primary" icon="plus" disabled={busy} />
    </Page>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
});
