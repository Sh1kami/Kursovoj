import { useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Action, Empty, Field, InlineError, Muted, Page, layout } from '../components/ui';
import { limits } from '../domain';
import { messageFor, useInventory } from '../hooks/useInventory';
import type { RootRoutes } from '../navigation';

export function CategoryForm({ navigation, route }: NativeStackScreenProps<RootRoutes, 'CategoryForm'>) {
  const { id } = route.params;
  const { categories, busy, change } = useInventory();
  const category = categories.find(row => row.id === id);
  const [name, setName] = useState(category?.name ?? '');
  const [error, setError] = useState('');
  const linked = (category?.itemCount ?? 0) > 0;

  async function save() {
    setError('');
    try {
      await change(repo => repo.saveCategory(name, id));
      navigation.goBack();
    } catch (failure) {
      setError(messageFor(failure));
    }
  }

  function confirmDelete() {
    if (id === undefined) return;
    Alert.alert('Видалити категорію?', 'Категорію «' + category?.name + '» буде видалено.', [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Видалити', style: 'destructive', onPress: async () => {
        try {
          await change(repo => repo.deleteCategory(id));
          navigation.goBack();
        } catch (failure) {
          setError(messageFor(failure));
        }
      } },
    ]);
  }

  if (id !== undefined && !category) {
    return <Page><Empty title="Категорію вилучено" detail="Поверніться до списку категорій та виберіть іншу." icon="tag" /></Page>;
  }

  return (
    <Page>
      <Field label="Назва категорії" hint="Обов’язкове поле" value={name} onChangeText={setName}
        placeholder="Наприклад, Інструменти" maxLength={limits.category} editable={!busy} />
      {error !== '' && <InlineError message={error} />}
      <Action title={busy ? 'Зберігаємо…' : 'Зберегти категорію'} action={save}
        tone="primary" disabled={busy} />
      {category && <View style={layout.stack}>
        <Action title="Видалити категорію" action={confirmDelete} tone="danger" disabled={busy || linked} />
        {linked && <Muted>Спочатку перемістіть або видаліть пов’язані речі. Речей у категорії: {category.itemCount}.</Muted>}
      </View>}
    </Page>
  );
}
