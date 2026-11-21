import { useState } from 'react';
import { Alert, Image, Linking, StyleSheet, View } from 'react-native';
import { CameraType, launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync,
  type ImagePickerAsset, type ImagePickerOptions } from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Action, Chip, Empty, Field, Group, Icon, InlineError, Label, Muted, Page, layout } from '../components/ui';
import { limits, validateItem } from '../domain';
import { messageFor, useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';
import { photoUri, removePhoto, storePhoto } from '../photos';
import type { ItemInput } from '../types';
import { usePalette } from '../theme';

type PhotoDraft = { kind: 'existing' } | { kind: 'remove' } | { kind: 'replace'; asset: ImagePickerAsset };

export function ItemForm({ route, navigation }: NativeStackScreenProps<RootRoutes, 'ItemForm'>) {
  const p = usePalette();
  const { id } = route.params;
  const { items, categories, busy, change } = useInventory();
  const item = items.find(row => row.id === id);
  const [input, setInput] = useState<ItemInput>(() => ({
    name: item?.name ?? '',
    categoryId: item?.categoryId ?? null,
    description: item?.description ?? '',
    location: item?.location ?? '',
  }));
  const [photo, setPhoto] = useState<PhotoDraft>({ kind: 'existing' });
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const previous = item?.photoName ?? null;
  const preview = photo.kind === 'replace' ? photo.asset.uri : photo.kind === 'existing' ? photoUri(previous) : undefined;

  async function pickPhoto(source: 'camera' | 'library') {
    setPicking(true);
    setError('');
    try {
      if (source === 'camera') {
        const permission = await requestCameraPermissionsAsync();
        if (!permission.granted) {
          if (!permission.canAskAgain) {
            Alert.alert('Дозвольте доступ до камери', 'Відкрийте налаштування iPhone або виберіть готове фото з галереї.', [
              { text: 'Гаразд', style: 'cancel' },
              { text: 'Налаштування', onPress: () => {
                void Linking.openSettings().catch(() => setError('Відкрийте налаштування камери на iPhone.'));
              } },
            ]);
          } else {
            setError('Для зйомки потрібен доступ до камери. Також можна вибрати фото з галереї.');
          }
          return;
        }
      }
      const options: ImagePickerOptions = { mediaTypes: ['images'], quality: 0.72 };
      const result = source === 'camera'
        ? await launchCameraAsync({ ...options, cameraType: CameraType.back })
        : await launchImageLibraryAsync(options);
      if (!result.canceled) setPhoto({ kind: 'replace', asset: result.assets[0] });
    } catch {
      setError(source === 'camera'
        ? 'Не вдалося відкрити камеру. Спробуйте ще раз або виберіть фото з галереї.'
        : 'Не вдалося відкрити галерею. Перевірте доступ до фото в налаштуваннях iPhone.');
    } finally {
      setPicking(false);
    }
  }

  async function save() {
    setError('');
    try {
      const valid = validateItem(input);
      await change(async repo => {
        const newPhoto = photo.kind === 'replace' ? await storePhoto(photo.asset) : null;
        const nextPhoto = photo.kind === 'existing' ? previous : newPhoto;
        try {
          await repo.saveItem(valid, nextPhoto, id);
        } catch (failure) {
          removePhoto(newPhoto);
          throw failure;
        }
        if (previous !== nextPhoto) removePhoto(previous);
      });
      navigation.goBack();
    } catch (failure) {
      setError(messageFor(failure));
    }
  }

  if (id !== undefined && !item) {
    return <Page><Empty title="Річ вилучено" detail="Поверніться до каталогу та виберіть інший запис." icon="archivebox" /></Page>;
  }

  return (
    <Page>
      <Group>
        {preview ? <Image accessibilityLabel="Вибране фото речі" accessible
          source={{ uri: preview }} style={[styles.preview, { backgroundColor: p.tint }]} resizeMode="cover" />
          : <View style={[styles.previewEmpty, { backgroundColor: p.tint }]}>
            <Icon name="camera" size={24} />
            <Label style={styles.fieldTitle}>Фото речі</Label>
            <Muted>Необов’язково</Muted>
          </View>}
        <View style={styles.photoActions}>
          <Action title="Зробити фото" action={() => pickPhoto('camera')} disabled={busy || picking} icon="camera" />
          <Action title="Галерея" action={() => pickPhoto('library')} disabled={busy || picking} icon="photo" />
        </View>
        {preview && <Action title="Прибрати фото" action={() => setPhoto({ kind: 'remove' })} disabled={busy || picking} />}
      </Group>
      <View style={layout.stack}>
        <Field label="Назва" hint="Обов’язкове поле" placeholder="Наприклад, ліхтарик" value={input.name}
          onChangeText={name => setInput(current => ({ ...current, name }))}
          maxLength={limits.name} editable={!busy} />
        <Label style={styles.fieldTitle}>Категорія</Label>
        {categories.length ? <View style={layout.wrap}>
          {categories.map(category => <Chip key={category.id} title={category.name}
            selected={category.id === input.categoryId}
            onPress={() => setInput(current => ({ ...current, categoryId: category.id }))} />)}
        </View> : <Group>
          <Empty title="Створіть категорію" detail="Для збереження речі потрібно вибрати категорію." icon="tag">
            <Action title="Нова категорія" action={() => navigation.navigate('CategoryForm', {})} />
          </Empty>
        </Group>}
        <Field label="Місце зберігання" placeholder="Наприклад, верхня шухляда" value={input.location}
          onChangeText={location => setInput(current => ({ ...current, location }))}
          maxLength={limits.location} editable={!busy} />
        <Field label="Опис" placeholder="Додаткові відомості про річ" value={input.description}
          onChangeText={description => setInput(current => ({ ...current, description }))}
          multiline maxLength={limits.description} editable={!busy} />
        <Muted>Назва й категорія обов’язкові.</Muted>
      </View>
      {error !== '' && <InlineError message={error} />}
      <Action title={busy ? 'Зберігаємо…' : 'Зберегти річ'} action={save}
        disabled={busy || picking || !categories.length} tone="primary" />
    </Page>
  );
}

const styles = StyleSheet.create({
  fieldTitle: { fontSize: 15, fontWeight: '600' },
  preview: { width: '100%', aspectRatio: 1.7 },
  previewEmpty: { minHeight: 116, justifyContent: 'center', alignItems: 'center', padding: 16, gap: 4 },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, padding: 4 },
});
