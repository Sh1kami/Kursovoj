import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Action, Empty, Group, Heading, Icon, ItemRow, Label, Muted, Page, layout } from '../components/ui';
import { useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';
import { usePalette } from '../theme';

export function Home() {
  const p = usePalette();
  const nav = useNavigation<NativeStackNavigationProp<RootRoutes>>();
  const { items, categories, busy } = useInventory();
  const recent = items.slice(0, 4);
  const favorites = items.filter(item => item.favorite).length;
  const locations = new Set(items.map(item => item.location.trim().toLowerCase()).filter(Boolean)).size;

  return (
    <Page>
      <View style={[styles.summary, { backgroundColor: p.cover }]}>
        <View style={styles.summaryTitle}>
          <Icon name="archivebox.fill" size={22} color={p.coverMuted} />
          <Label accessibilityRole="header" style={[styles.coverTitle, { color: p.onCover }]}>Мій інвентар</Label>
        </View>
        <View style={[styles.rule, { borderColor: p.coverLine }]} />
        <View style={styles.metrics}>
          <Metric count={items.length} title="Речі" />
          <Metric count={categories.length} title="Категорії" />
          <Metric count={locations} title="Місця" />
        </View>
      </View>
      <Action title="Додати річ" action={() => nav.navigate('ItemForm', {})}
        tone="primary" icon="plus" disabled={busy} />
      <Pressable onPress={() => nav.navigate('Favorites')} accessibilityRole="button"
        accessibilityLabel={'Обране, речей: ' + favorites}
        style={({ pressed }) => [styles.shortcut, { backgroundColor: pressed ? p.tint : p.surface, borderColor: p.line }]}>
        <View style={[styles.shortcutIcon, { backgroundColor: p.tint }]}><Icon name="star.fill" /></View>
        <View style={layout.grow}>
          <Label style={styles.shortcutTitle}>Обране</Label>
          <Muted>{favorites ? 'Позначено: ' + favorites : 'Зберігайте важливе під рукою'}</Muted>
        </View>
        <Icon name="chevron.right" size={13} color={p.muted} />
      </Pressable>
      <View style={layout.stack}>
        <View style={styles.section}>
          <Heading>Нещодавно додані</Heading>
          {items.length > 0 && <Action title="Усі речі" action={() => nav.navigate('Tabs', { screen: 'Catalog' })} />}
        </View>
        <Group>
          {recent.length ? recent.map((item, index) =>
            <ItemRow key={item.id} item={item} divided={index < recent.length - 1}
              onPress={() => nav.navigate('Details', { id: item.id })} />
          ) : <Empty title="Поки що порожньо" detail="Додайте першу річ із назвою, місцем або фото." icon="archivebox" />}
        </Group>
      </View>
    </Page>
  );
}

function Metric({ count, title }: { count: number; title: string }) {
  const p = usePalette();
  return <View style={styles.metric} accessible accessibilityLabel={title + ': ' + count}>
    <Label style={[styles.number, { color: p.onCover }]}>{count}</Label>
    <Muted style={{ color: p.coverMuted }}>{title}</Muted>
  </View>;
}

const styles = StyleSheet.create({
  summary: { borderRadius: 16, padding: 21, gap: 13 },
  summaryTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coverTitle: { fontSize: 21, fontWeight: '700', flexShrink: 1, letterSpacing: -0.3 },
  rule: { borderTopWidth: StyleSheet.hairlineWidth },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flexGrow: 1, minWidth: 81, gap: 1 },
  number: { fontSize: 35, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.7 },
  shortcut: {
    minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, padding: 13,
  },
  shortcutIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  shortcutTitle: { fontWeight: '700', marginBottom: 2 },
  section: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' },
});
