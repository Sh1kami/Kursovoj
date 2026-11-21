import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { Item } from './types';

const directory = new Directory(Paths.document, 'item-photos');
const ownedPhoto = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/i;

export function photoUri(name: string | null) {
  return name && ownedPhoto.test(name) ? new File(directory, name).uri : undefined;
}

export async function storePhoto(asset: ImagePickerAsset) {
  const extension = asset.fileName?.match(/\.([a-z0-9]{2,5})$/i)?.[1]
    ?? asset.uri.match(/\.([a-z0-9]{2,5})$/i)?.[1]
    ?? 'jpg';
  const name = randomUUID() + '.' + extension.toLowerCase();
  try {
    directory.create({ idempotent: true, intermediates: true });
    await new File(asset.uri).copy(new File(directory, name));
    return name;
  } catch {
    removePhoto(name);
    throw new Error('Не вдалося зберегти фото. Виберіть його ще раз або збережіть річ без фото.');
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
