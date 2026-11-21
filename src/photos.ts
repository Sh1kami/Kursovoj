import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { isBackupPhotoExtension, type BackupPhoto } from './backupFormat';
import type { Item } from './types';

const directory = new Directory(Paths.document, 'item-photos');
const ownedPhoto = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/i;

export function photoUri(name: string | null) {
  return name && ownedPhoto.test(name) ? new File(directory, name).uri : undefined;
}

export async function storePhoto(asset: ImagePickerAsset) {
  const source = new File(asset.uri);
  const extension = [source.extension.slice(1), asset.fileName?.split('.').pop()]
    .map(value => value?.toLowerCase() ?? '')
    .find(isBackupPhotoExtension) ?? 'jpg';
  const name = randomUUID() + '.' + extension;
  try {
    directory.create({ idempotent: true, intermediates: true });
    await source.copy(new File(directory, name));
    return name;
  } catch {
    removePhoto(name);
    throw new Error('Не вдалося зберегти фото. Виберіть його ще раз або збережіть річ без фото.');
  }
}

export async function readPhoto(name: string, maxBytes: number): Promise<BackupPhoto> {
  const extension = name.split('.').pop() ?? '';
  if (!ownedPhoto.test(name) || !isBackupPhotoExtension(extension)) {
    throw new Error('Резервну копію не створено: є запис із непідтримуваним фото.');
  }
  const file = new File(directory, name);
  if (!file.exists || !file.size) throw new Error('Резервну копію не створено: одне з фото відсутнє.');
  if (file.size > maxBytes) throw new Error('Резервна копія перевищує 40 МБ.');
  return { extension, base64: await file.base64() };
}

export async function writeBackupPhoto(photo: BackupPhoto) {
  if (!isBackupPhotoExtension(photo.extension)) throw new Error('Непідтримуваний формат фото.');
  directory.create({ idempotent: true, intermediates: true });
  const name = randomUUID() + '.' + photo.extension;
  try {
    await new File(directory, name).write(photo.base64, { encoding: 'base64' });
    return name;
  } catch {
    removePhoto(name);
    throw new Error('Не вдалося відновити фото. Перевірте вільне місце на iPhone.');
  }
}

export function removePhoto(name: string | null) {
  if (!name || !ownedPhoto.test(name)) return;
  try {
    const file = new File(directory, name);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Не вдалося очистити копію фото.', error);
  }
}

export function cleanUnusedPhotos(items: Item[]) {
  try {
    if (!directory.exists) return;
    const used = new Set(items.map(item => item.photoName));
    for (const entry of directory.list()) {
      if (entry instanceof File && !used.has(entry.name)) removePhoto(entry.name);
    }
  } catch (error) {
    console.warn('Не вдалося перевірити папку з фото.', error);
  }
}
