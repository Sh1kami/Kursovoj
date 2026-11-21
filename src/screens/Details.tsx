import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Action, Empty, Group, Heading, Icon, Label, Muted, Page, layout } from '../components/ui';
import { messageFor, useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';
import { photoUri, removePhoto } from '../photos';
import { usePalette } from '../theme';

const formatter = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium' });

export function Details({ navigation, route }: NativeStackScreenProps<RootRoutes, 'Details'>) {
  const { items, busy, change } = useInventory();
  const p = usePalette();
  const item = items.find(row => row.id === route.params.id);
  if (!item) {
    return <Page><Empty title="Річ вилучено" detail="Поверніться до каталогу та виберіть інший запис." icon="archivebox" /></Page>;
  }
  const { id, name, createdAt, categoryName, description, photoName, location, favorite } = item;
  const uri = photoUri(photoName);

  async function toggleFavorite() {
    try {
      await change(repo => repo.setFavorite(id, !favorite));
    } catch (error) {
      Alert.alert('Не вдалося оновити обране', messageFor(error));
    }
  }

  function confirmDelete() {
    Alert.alert('Видалити річ?', 'Запис «' + name + '» і його локальну копію фото буде видалено.', [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Видалити', style: 'destructive', onPress: async () => {
        try {
          await change(async repo => {
            await repo.deleteItem(id);
            removePhoto(photoName);
          });
          navigation.goBack();
        } catch (error) {
          Alert.alert('Не вдалося видалити річ', messageFor(error));
        }
      } },
    ]);
  }

  return (
    <Page>
      {uri && <Pressable accessibilityRole="button" accessibilityLabel={'Відкрити фото: ' + name}
        onPress={() => navigation.navigate('Photo', { id })}
        style={[styles.imageFrame, { backgroundColor: p.tint }]}>
        <Image source={{ uri }} resizeMode="contain" style={styles.image} />
        <View style={[styles.expand, { backgroundColor: p.surface }]}>
          <Icon name="arrow.up.left.and.arrow.down.right" size={15} />
        </View>
      </Pressable>}
      <View style={styles.titleRow}>
        <View style={layout.grow}><Heading>{name}</Heading></View>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: favorite, disabled: busy }}
          accessibilityLabel={favorite ? 'Прибрати з обраного' : 'Додати до обраного'}
          onPress={toggleFavorite} disabled={busy}
          style={({ pressed }) => [styles.favorite, { backgroundColor: pressed || favorite ? p.tint : p.surface, borderColor: p.line }]}>
          <Icon name={favorite ? 'star.fill' : 'star'} size={23} />
        </Pressable>
      </View>
      <Group>
        <View style={styles.details}>
          <Detail label="Категорія" value={categoryName} />
          <Detail label="Місце зберігання" value={location || 'Не вказано'} />
          <Detail label="Дата додавання" value={formatter.format(new Date(createdAt))} />
          {description !== '' && <Detail label="Опис" value={description} />}
        </View>
      </Group>
      <View style={layout.stack}>
        <Action title="Редагувати" action={() => navigation.navigate('ItemForm', { id })}
          tone="primary" icon="pencil" disabled={busy} />
        <Action title="Видалити річ" action={confirmDelete} tone="danger" disabled={busy} />
      </View>
    </Page>
  );
}

export function Photo({ route }: NativeStackScreenProps<RootRoutes, 'Photo'>) {
  const { items } = useInventory();
  const item = items.find(row => row.id === route.params.id);
  const uri = photoUri(item?.photoName ?? null);
  if (!item || !uri) {
    return <Page><Empty title="Фото недоступне" detail="Поверніться до картки речі." icon="photo" /></Page>;
  }
  return <View style={styles.viewer}>
    <Image source={{ uri }} accessible accessibilityLabel={'Фото: ' + item.name} resizeMode="contain" style={styles.viewerImage} />
  </View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.field}><Muted>{label}</Muted><Label selectable>{value}</Label></View>;
}

const styles = StyleSheet.create({
  imageFrame: { aspectRatio: 1.25, borderRadius: 15, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  viewer: { flex: 1, justifyContent: 'center' },
  viewerImage: { flex: 1, width: '100%' },
  expand: { position: 'absolute', right: 10, bottom: 10, borderRadius: 12, padding: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favorite: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  details: { padding: 16, gap: 17 },
  field: { gap: 3 },
});
