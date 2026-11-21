import { normalizeName } from '../domain.ts';

export type SqlValue = string | number | null;

export interface Database {
  exec(sql: string): Promise<void>;
  run(sql: string, ...params: SqlValue[]): Promise<{ changes: number; lastInsertRowId: number }>;
  all<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  transaction(work: () => Promise<void>): Promise<void>;
}

const schemaVersion = 1;
const starterCategories = ['Електроніка', 'Документи', 'Одяг', 'Дім'];

const schema = `
  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 50),
    name_key TEXT NOT NULL UNIQUE
  );

  CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100),
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 1000),
    location TEXT NOT NULL DEFAULT '' CHECK(length(location) <= 150),
    photo_name TEXT UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE INDEX items_category_idx ON items(category_id);
  CREATE INDEX items_created_idx ON items(created_at DESC, id DESC);
`;

export async function migrate(db: Database) {
  await db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const [{ user_version: version }] = await db.all<{ user_version: number }>('PRAGMA user_version');
  if (version > schemaVersion) throw new Error('База даних створена новішою версією застосунку.');
  if (version === schemaVersion) return;

  await db.transaction(async () => {
    await db.exec(schema);
    for (const name of starterCategories) {
      await db.run('INSERT INTO categories (name, name_key) VALUES (?, ?)', name, normalizeName(name));
    }
    await db.exec('PRAGMA user_version = 1');
  });
}
