import { randomUUID } from 'expo-crypto';
import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { backupFormat, maxBackupBytes, parseBackup, type BackupItem, type InventoryBackup } from './backupFormat';
import type { Repository } from './database/repository';
import { readPhoto, removePhoto, writeBackupPhoto } from './photos';
import type { Snapshot } from './types';

function clearTemporaryFile(file: File) {
  try {
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Не вдалося прибрати тимчасовий файл.', error);
  }
}

export async function exportBackup({ categories, items }: Snapshot) {
  if (!await isAvailableAsync()) throw new Error('Поширення файлів зараз недоступне.');
  const collection: BackupItem[] = [];
  const indexes = new Map(categories.map((category, index) => [category.id, index]));
  let remaining = maxBackupBytes;
  for (const { name, categoryId, description, location, createdAt, favorite, photoName } of items) {
    const categoryIndex = indexes.get(categoryId);
    if (categoryIndex === undefined) throw new Error('Не вдалося прочитати категорію речі.');
    const photo = photoName ? await readPhoto(photoName, Math.floor(remaining * 3 / 4)) : null;
    remaining -= photo?.base64.length ?? 0;
    collection.push({ name, categoryIndex, description, location, createdAt, favorite, photo });
  }
  const backup: InventoryBackup = {
    format: backupFormat, version: 1, categories: categories.map(category => category.name), items: collection,
  };
  const file = new File(Paths.cache, 'osobysti-rechi-' + randomUUID().slice(0, 8) + '.json');
  try {
    await file.write(JSON.stringify(backup));
    if (file.size > maxBackupBytes) throw new Error('Резервна копія перевищує 40 МБ.');
    await shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  } finally {
    clearTemporaryFile(file);
  }
}

export async function chooseBackup() {
  const result = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  try {
    if (file.size > maxBackupBytes) throw new Error('Резервна копія перевищує 40 МБ.');
    return parseBackup(await file.text());
  } finally {
    clearTemporaryFile(file);
  }
}

export async function restoreBackup(repo: Repository, backup: InventoryBackup) {
  const previous = await repo.snapshot();
  const newPhotos: string[] = [];
  const items: Parameters<Repository['replaceInventory']>[1] = [];
  try {
    for (const { photo, ...item } of backup.items) {
      const photoName = photo ? await writeBackupPhoto(photo) : null;
      if (photoName) newPhotos.push(photoName);
      items.push({ ...item, photoName });
    }
    await repo.replaceInventory(backup.categories, items);
  } catch (error) {
    for (const name of newPhotos) removePhoto(name);
    throw error;
  }
  for (const item of previous.items) removePhoto(item.photoName);
}
