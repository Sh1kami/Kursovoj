import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createRepository } from '../src/database/repository.ts';
import { migrate, type Database, type SqlValue } from '../src/database/schema.ts';

function open(path: string) {
  const sqlite = new DatabaseSync(path, { enableForeignKeyConstraints: false });
  const db: Database = {
    async exec(sql) { sqlite.exec(sql); },
    async run(sql, ...params) {
      const result = sqlite.prepare(sql).run(...params);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async all<T>(sql: string, ...params: SqlValue[]) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async transaction(work) {
      sqlite.exec('BEGIN');
      try {
        await work();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return { db, close: () => sqlite.close(), repo: createRepository(db) };
}

test('SQLite CRUD, parameter binding and foreign keys', async () => {
  const { db, repo, close } = open(':memory:');
  try {
    await migrate(db);
    assert.equal((await repo.snapshot()).categories.length, 4);
    await repo.saveCategory('Ґаджети');
    await assert.rejects(repo.saveCategory(' ґАДЖЕТИ '), /вже існує/);
    const category = (await repo.snapshot()).categories.find(row => row.name === 'Ґаджети')!;
    const input = {
      name: "Об'єктив %_",
      categoryId: category.id,
      location: 'Сумка',
      description: 'Запасний',
    };
    const id = await repo.saveItem(input, null);
    await repo.saveCategory('Оптика', category.id);
    let { items, categories } = await repo.snapshot();
    assert.equal(categories.find(row => row.id === category.id)?.itemCount, 1);
    assert.equal(items[0].categoryName, 'Оптика');
    assert.equal(items[0].name, input.name);
    assert.equal(items[0].favorite, false);
    await repo.setFavorite(id, true);
    const createdAt = items[0].createdAt;
    await repo.saveItem({ ...input, location: 'Шафа' }, 'photo.jpg', id);
    ({ items } = await repo.snapshot());
    assert.equal(items[0].location, 'Шафа');
    assert.equal(items[0].photoName, 'photo.jpg');
    assert.equal(items[0].createdAt, createdAt);
    assert.equal(items[0].favorite, true);
    await assert.rejects(repo.deleteCategory(category.id), /перемістіть/);
    await assert.rejects(db.run('DELETE FROM categories WHERE id = ?', category.id), /FOREIGN KEY/);
    await assert.rejects(repo.saveItem({ ...input, categoryId: 9999 }, null), /FOREIGN KEY/);
    await repo.deleteItem(id);
    await repo.deleteCategory(category.id);
    assert.equal((await repo.snapshot()).items.length, 0);
    assert.equal((await repo.snapshot()).categories.length, 4);
  } finally {
    close();
  }
});

test('version 1 catalog migrates without recreating categories or losing records', async () => {
  const { db, repo, close } = open(':memory:');
  try {
    await db.exec(`
      CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT, name_key TEXT);
      CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT, category_id INTEGER REFERENCES categories(id),
        location TEXT, description TEXT, photo_name TEXT, created_at TEXT);
      INSERT INTO categories VALUES (25, 'Архів', 'архів');
      INSERT INTO items VALUES (77, 'Абетка', 25, 'Шафа', '', 'example.heic', '2026-11-21T10:00:00.000Z');
      PRAGMA user_version = 1;
    `);
    await migrate(db);
    await migrate(db);
    const snapshot = await repo.snapshot();
    assert.equal(snapshot.categories.length, 1);
    assert.equal(snapshot.items[0].id, 77);
    assert.equal(snapshot.items[0].photoName, 'example.heic');
    assert.equal(snapshot.items[0].favorite, false);
    assert.equal((await db.all<{ user_version: number }>('PRAGMA user_version'))[0].user_version, 2);
  } finally {
    close();
  }
});

test('restoring uses one transaction and preserves current data after an invalid row', async () => {
  const { db, repo, close } = open(':memory:');
  try {
    await migrate(db);
    await repo.addDemoItems();
    const previous = await repo.snapshot();
    const row = {
      name: 'Ліхтар', categoryIndex: 0, location: 'Полиця', description: '',
      favorite: true, photoName: 'import.jpg', createdAt: '2026-11-21T10:00:00.000Z',
    };
    await assert.rejects(repo.replaceInventory(['Дім'], [row, { ...row, categoryIndex: 1 }]), /категорію/);
    assert.deepEqual(await repo.snapshot(), previous);
    await repo.replaceInventory(['Інструменти', 'Порожня'], [row]);
    const restored = await repo.snapshot();
    assert.equal(restored.categories.length, 2);
    assert.equal(restored.items.length, 1);
    assert.equal(restored.items[0].name, row.name);
    assert.equal(restored.items[0].categoryName, 'Інструменти');
    assert.equal(restored.items[0].favorite, true);
    assert.equal(restored.items[0].photoName, row.photoName);
    assert.equal(restored.items[0].createdAt, row.createdAt);
  } finally {
    close();
  }
});

test('Migration persists to disk, and demo adds only missing samples', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'osobysti-rechi-'));
  t.after(() => rm(directory, { force: true, recursive: true }));
  const path = join(directory, 'items.db');
  const original = open(path);
  try {
    await migrate(original.db);
    const { categories } = await original.repo.snapshot();
    await original.repo.saveCategory('Архів', categories[0].id);
    assert.equal(await original.repo.addDemoItems(), 4);
    assert.equal(await original.repo.addDemoItems(), 0);
  } finally {
    original.close();
  }
  const reopened = open(path);
  try {
    await migrate(reopened.db);
    const { items, categories } = await reopened.repo.snapshot();
    assert.equal(items.length, 4);
    assert.equal(categories.length, 4);
    assert.ok(categories.some(category => category.name === 'Архів'));
    assert.equal((await reopened.db.all<{ foreign_keys: number }>('PRAGMA foreign_keys'))[0].foreign_keys, 1);
  } finally {
    reopened.close();
  }
});
