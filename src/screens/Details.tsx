import { Alert, Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Action, Empty, Group, Heading, Label, Muted, Page, layout } from '../components/ui';
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
  const { id, name, createdAt, categoryName, description, photoName, location } = item;
  const uri = photoUri(photoName);

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
      {uri && <Image source={{ uri }} accessible accessibilityLabel={'Фото: ' + name}
        resizeMode="contain" style={[styles.image, { backgroundColor: p.surface }]} />}
      <Heading>{name}</Heading>
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

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.field}><Muted>{label}</Muted><Label selectable>{value}</Label></View>;
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 1.25, borderRadius: 14 },
  details: { padding: 16, gap: 17 },
  field: { gap: 3 },
});
