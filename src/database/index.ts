import { openDatabaseAsync } from 'expo-sqlite';
import { createRepository, type Repository } from './repository';
import { migrate, type Database, type SqlValue } from './schema';

let opening: Promise<Repository> | undefined;

export function openRepository() {
  opening ??= connect().catch((error: unknown) => {
    opening = undefined;
    throw error;
  });
  return opening;
}

async function connect() {
  const sqlite = await openDatabaseAsync('osobysti-rechi.db');
  const db: Database = {
    exec: sql => sqlite.execAsync(sql),
    run: (sql, ...params) => sqlite.runAsync(sql, ...params),
    all: <T>(sql: string, ...params: SqlValue[]) => sqlite.getAllAsync<T>(sql, ...params),
    transaction: work => sqlite.withTransactionAsync(work),
  };

  try {
    await migrate(db);
    return createRepository(db);
  } catch (error) {
    await sqlite.closeAsync();
    throw error;
  }
}
