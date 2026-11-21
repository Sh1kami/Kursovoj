import type { Item, ItemInput } from './types.ts';

export const limits = {
  name: 100,
  category: 50,
  location: 150,
  description: 1000,
};

export function normalizeName(value: string) {
  return value.normalize('NFKC').trim().toLowerCase().replace(/[’ʼ]/g, "'");
}

export function validateCategory(value: string) {
  const name = value.trim();
  if (!name) throw new Error('Введіть назву категорії.');
  if (name.length > limits.category) throw new Error('Назва категорії має містити до 50 символів.');
  return name;
}

export function validateItem(input: ItemInput) {
  const name = input.name.trim();
  const location = input.location.trim();
  const description = input.description.trim();
  const { categoryId } = input;
  if (!name) throw new Error('Введіть назву речі.');
  if (name.length > limits.name) throw new Error('Назва речі має містити до 100 символів.');
  if (categoryId === null || !Number.isSafeInteger(categoryId) || categoryId < 1) {
    throw new Error('Виберіть категорію.');
  }
  if (location.length > limits.location) throw new Error('Місце зберігання має містити до 150 символів.');
  if (description.length > limits.description) throw new Error('Опис має містити до 1000 символів.');
  return { name, categoryId, location, description };
}

export type ItemSort = 'newest' | 'name' | 'location';
const byText = new Intl.Collator('uk', { sensitivity: 'base', numeric: true });

export function filterItems(items: Item[], query: string, categoryId: number | null,
  favoritesOnly = false, sort: ItemSort = 'newest') {
  const needle = normalizeName(query);
  const results = items.filter(item =>
    (categoryId === null || item.categoryId === categoryId) &&
    (!favoritesOnly || item.favorite) &&
    (normalizeName(item.name).includes(needle) || normalizeName(item.location).includes(needle))
  );
  if (sort === 'name') return results.sort((first, second) => byText.compare(first.name, second.name));
  if (sort === 'location') return results.sort((first, second) =>
    Number(!first.location) - Number(!second.location) ||
    byText.compare(first.location, second.location) ||
    byText.compare(first.name, second.name)
  );
  return results;
}
