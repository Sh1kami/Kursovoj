import { normalizeName, validateCategory, validateItem } from './domain.ts';

export const backupFormat = 'osobysti-rechi';
export const maxBackupBytes = 40 * 1024 * 1024;

export interface BackupPhoto {
  extension: string;
  base64: string;
}

export interface BackupItem {
  name: string;
  categoryIndex: number;
  location: string;
  description: string;
  createdAt: string;
  favorite: boolean;
  photo: BackupPhoto | null;
}

export interface InventoryBackup {
  format: typeof backupFormat;
  version: 1;
  categories: string[];
  items: BackupItem[];
}

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif', 'avif', 'tif', 'tiff', 'bmp']);

export function isBackupPhotoExtension(value: string) {
  return imageExtensions.has(value);
}

function invalid(): never {
  throw new Error('Файл не є підтримуваною резервною копією «Особисті речі».');
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  if (typeof value !== 'string') invalid();
  return value;
}

function readPhoto(value: unknown): BackupPhoto | null {
  if (value === null) return null;
  const photo = readObject(value);
  const extension = readString(photo.extension);
  const base64 = readString(photo.base64);
  if (!isBackupPhotoExtension(extension) || !base64 || base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+=*$/.test(base64) || base64.endsWith('===')) invalid();
  return { extension, base64 };
}

export function parseBackup(text: string): InventoryBackup {
  if (text.length > maxBackupBytes) throw new Error('Резервна копія перевищує 40 МБ.');
  let input: unknown;
  try { input = JSON.parse(text); } catch { invalid(); }
  const value = readObject(input);
  if (value.format !== backupFormat || value.version !== 1 ||
    !Array.isArray(value.categories) || !Array.isArray(value.items)) invalid();

  const categories = value.categories.map(entry => validateCategory(readString(entry)));
  if (new Set(categories.map(normalizeName)).size !== categories.length) invalid();
  const items = value.items.map((entry): BackupItem => {
    const item = readObject(entry);
    const { categoryIndex, favorite } = item;
    if (typeof categoryIndex !== 'number' || !Number.isInteger(categoryIndex) ||
      categoryIndex < 0 || categoryIndex >= categories.length || typeof favorite !== 'boolean') invalid();
    const createdAt = readString(item.createdAt);
    const timestamp = new Date(createdAt);
    if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== createdAt) invalid();
    const { name, location, description } = validateItem({
      name: readString(item.name),
      location: readString(item.location),
      description: readString(item.description),
      categoryId: categoryIndex + 1,
    });
    return { name, location, description, categoryIndex, favorite, createdAt, photo: readPhoto(item.photo) };
  });
  return { format: backupFormat, version: 1, categories, items };
}
