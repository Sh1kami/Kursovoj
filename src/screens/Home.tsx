import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Action, Empty, Group, Heading, Icon, ItemRow, Label, Muted, Page, layout } from '../components/ui';
import { messageFor, useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';
import { usePalette } from '../theme';

export function Home() {
  const p = usePalette();
  const nav = useNavigation<NativeStackNavigationProp<RootRoutes>>();
  const { items, categories, busy, change } = useInventory();
  const recent = items.slice(0, 5);

  function confirmDemo() {
    Alert.alert('Додати демонстраційні записи?', 'У каталозі з’являться до чотирьох записів із позначкою «Демо». Їх можна видалити як звичайні речі.', [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Додати', onPress: async () => {
        try {
          const count = await change(repo => repo.addDemoItems());
          const message = count > 0
            ? 'Демонстраційні речі з’явилися в каталозі.'
            : categories.length ? 'Усі приклади вже є в каталозі.' : 'Спочатку створіть категорію.';
          Alert.alert('Демо-дані', message);
        } catch (error) {
          Alert.alert('Не вдалося додати демо-дані', messageFor(error));
        }
      } },
    ]);
  }

  return (
    <Page>
      <View style={layout.stack}>
        <View style={[styles.summary, { backgroundColor: p.tint }]}>
          <View style={styles.metric}>
            <Icon name="archivebox" />
            <Label style={styles.number}>{items.length}</Label>
            <Muted>Речі</Muted>
          </View>
          <View style={[styles.metric, styles.secondMetric, { borderColor: p.accent }]}>
            <Icon name="tag" />
            <Label style={styles.number}>{categories.length}</Label>
            <Muted>Категорії</Muted>
          </View>
        </View>
        <Action title="Додати річ" action={() => nav.navigate('ItemForm', {})}
          tone="primary" icon="plus" disabled={busy} />
      </View>
      <View style={layout.stack}>
        <Heading>Останні додані</Heading>
        <Group>
          {recent.length ? recent.map((item, index) =>
            <ItemRow key={item.id} item={item} divided={index < recent.length - 1}
              onPress={() => nav.navigate('Details', { id: item.id })} />
          ) : <Empty title="Поки що порожньо" detail="Додайте першу річ, щоб вона з’явилася тут." icon="archivebox" />}
        </Group>
      </View>
      <Action title="Додати демо-дані…" action={confirmDemo} disabled={busy} icon="tray.and.arrow.down" />
    </Page>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 15, paddingVertical: 19, paddingHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flex: 1, minWidth: 114, gap: 4 },
  secondMetric: { borderLeftWidth: StyleSheet.hairlineWidth, paddingLeft: 18 },
  number: { fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.8 },
});
