import { normalizeName, validateCategory, validateItem } from '../domain.ts';
import type { Category, Item, ItemInput, Snapshot } from '../types.ts';
import type { Database } from './schema.ts';

const collator = new Intl.Collator('uk', { sensitivity: 'base' });

export function createRepository(db: Database) {
  async function saveCategory(input: string, id?: number) {
    const name = validateCategory(input);
    const key = normalizeName(name);
    const result = id === undefined
      ? await db.run('INSERT INTO categories (name, name_key) VALUES (?, ?) ON CONFLICT(name_key) DO NOTHING', name, key)
      : await db.run('UPDATE OR IGNORE categories SET name = ?, name_key = ? WHERE id = ?', name, key, id);
    if (!result.changes) {
      const [category] = await db.all<{ id: number }>('SELECT id FROM categories WHERE name_key = ?', key);
      throw new Error(category ? 'Категорія з такою назвою вже існує.' : 'Категорію вже видалено.');
    }
  }

  async function deleteCategory(id: number) {
    const result = await db.run(`
      DELETE FROM categories WHERE id = ?
        AND NOT EXISTS (SELECT 1 FROM items WHERE category_id = ?)
    `, id, id);
    if (!result.changes) {
      const [category] = await db.all<{ id: number }>('SELECT id FROM categories WHERE id = ?', id);
      if (category) throw new Error('Спочатку перемістіть речі в іншу категорію або видаліть їх.');
    }
  }

  async function saveItem(input: ItemInput, photoName: string | null, id?: number) {
    const { name, categoryId, description, location } = validateItem(input);
    const params = [name, categoryId, description, location, photoName];
    if (id === undefined) {
      const result = await db.run(`
        INSERT INTO items (name, category_id, description, location, photo_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ...params, new Date().toISOString());
      return result.lastInsertRowId;
    }
    const result = await db.run(`
      UPDATE items SET name = ?, category_id = ?, description = ?, location = ?, photo_name = ? WHERE id = ?
    `, ...params, id);
    if (!result.changes) throw new Error('Річ уже видалено.');
    return id;
  }

  async function snapshot(): Promise<Snapshot> {
    const categories = await db.all<Category>(`
      SELECT c.id, c.name, COUNT(i.id) AS itemCount
      FROM categories c LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id
    `);
    categories.sort((first, second) => collator.compare(first.name, second.name));

    const items = await db.all<Item>(`
      SELECT i.id, i.name, i.category_id AS categoryId, c.name AS categoryName,
        i.description, i.location, i.photo_name AS photoName, i.created_at AS createdAt
      FROM items i JOIN categories c ON c.id = i.category_id
      ORDER BY i.created_at DESC, i.id DESC
    `);
    return { categories, items };
  }

  async function addDemoItems() {
    const result = await db.run(`
      WITH samples(name, category_key, description, location) AS (
        VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)
      )
      INSERT INTO items (name, category_id, description, location, created_at)
      SELECT samples.name, COALESCE(
        (SELECT id FROM categories WHERE name_key = category_key),
        (SELECT MIN(id) FROM categories)
      ), samples.description, samples.location, ?
      FROM samples
      WHERE EXISTS (SELECT 1 FROM categories)
        AND NOT EXISTS (SELECT 1 FROM items WHERE items.name = samples.name)
    `,
      'Демо · Навушники', 'електроніка', 'Приклад запису про техніку.', 'Робочий стіл',
      'Демо · Паспорт', 'документи', 'Приклад запису про документ.', 'Папка у шафі',
      'Демо · Ліхтарик', 'дім', 'Приклад запису про домашню річ.', 'Верхня шухляда',
      'Демо · Павербанк', 'електроніка', 'Приклад запису про техніку.', 'Рюкзак',
      new Date().toISOString(),
    );
    return result.changes;
  }

  return {
    snapshot, saveCategory, deleteCategory, saveItem, addDemoItems,
    async deleteItem(id: number) {
      await db.run('DELETE FROM items WHERE id = ?', id);
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
