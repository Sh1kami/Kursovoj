import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { chooseBackup, exportBackup, restoreBackup } from '../backup';
import { type InventoryBackup } from '../backupFormat';
import { Action, Group, Heading, Icon, InlineError, Label, Muted, Page, layout } from '../components/ui';
import { messageFor, useInventory } from '../hooks/useInventory';
import { usePalette } from '../theme';

export function Data() {
  const p = usePalette();
  const { busy, change, categories } = useInventory();
  const [task, setTask] = useState<'export' | 'import' | null>(null);
  const [error, setError] = useState('');
  const disabled = busy || task !== null;

  async function withStatus(kind: 'export' | 'import', work: () => Promise<void>) {
    setTask(kind);
    setError('');
    try {
      await work();
    } catch (failure) {
      setError(messageFor(failure));
    } finally {
      setTask(null);
    }
  }

  function confirmRestore(backup: InventoryBackup) {
    Alert.alert('Замінити поточний каталог?', 'У файлі речей: ' + backup.items.length +
      ', категорій: ' + backup.categories.length + '. Після відновлення каталог міститиме дані з цього файла.', [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Замінити каталог', style: 'destructive', onPress: () => {
        void withStatus('import', async () => {
          await change(repo => restoreBackup(repo, backup));
          Alert.alert('Каталог відновлено', 'Речі та фотографії з копії доступні у застосунку.');
        });
      } },
    ]);
  }

  function confirmDemo() {
    Alert.alert('Додати демонстраційні записи?', 'У каталозі з’являться до чотирьох речей із позначкою «Демо».', [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Додати', onPress: async () => {
        setError('');
        try {
          const count = await change(repo => repo.addDemoItems());
          Alert.alert('Демо-дані', count ? 'Демонстраційні речі з’явилися в каталозі.'
            : categories.length ? 'Усі приклади вже є в каталозі.' : 'Спочатку створіть категорію.');
        } catch (failure) {
          setError(messageFor(failure));
        }
      } },
    ]);
  }

  return <Page>
    <View style={[styles.panel, { backgroundColor: p.tint }]}>
      <Icon name="internaldrive" size={27} />
      <Heading>Резервна копія</Heading>
      <Muted>Збережіть каталог разом із фото у «Файли» або перенесіть його на інший пристрій.</Muted>
    </View>
    <View style={layout.stack}>
      <Group>
        <Action title={task === 'export' ? 'Готуємо файл…' : 'Експортувати копію'}
          icon="square.and.arrow.up" disabled={disabled}
          action={() => withStatus('export', () => change(async repo => exportBackup(await repo.snapshot())))} />
        <View style={[styles.rule, { borderColor: p.line }]} />
        <Action title={task === 'import' ? 'Працюємо з файлом…' : 'Відновити з файла'}
          icon="square.and.arrow.down" disabled={disabled}
          action={() => withStatus('import', async () => {
            const backup = await chooseBackup();
            if (backup) confirmRestore(backup);
          })} />
      </Group>
      <Muted>Формат JSON, до 40 МБ. Копія містить ваші назви, місця зберігання й фотографії.</Muted>
      {error !== '' && <InlineError message={error} />}
    </View>
    <View style={layout.stack}>
      <Label accessibilityRole="header" style={styles.subheading}>Демонстрація</Label>
      <Group>
        <Action title="Додати демо-дані…" action={confirmDemo} disabled={disabled} icon="tray.and.arrow.down" />
      </Group>
    </View>
  </Page>;
}

const styles = StyleSheet.create({
  panel: { borderRadius: 16, gap: 8, padding: 20 },
  rule: { borderTopWidth: StyleSheet.hairlineWidth },
  subheading: { fontWeight: '700' },
});
