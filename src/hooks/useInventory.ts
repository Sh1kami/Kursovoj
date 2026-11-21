import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { openRepository } from '../database';
import type { Repository } from '../database/repository';
import { cleanUnusedPhotos } from '../photos';
import type { Snapshot } from '../types';

interface Inventory extends Snapshot {
  busy: boolean;
  change<T>(work: (repo: Repository) => Promise<T>): Promise<T>;
}

export const InventoryContext = createContext<Inventory | null>(null);

export function useInventory() {
  const inventory = useContext(InventoryContext);
  if (!inventory) throw new Error('Сховище ще не відкрите.');
  return inventory;
}

export function useInventoryStore() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);

  useEffect(() => {
    let current = true;
    openRepository().then(repo => repo.snapshot()).then(next => {
      if (current) {
        cleanUnusedPhotos(next.items);
        setSnapshot(next);
      }
    }).catch((error: unknown) => {
      console.warn('Не вдалося відкрити каталог.', error);
      if (current) setLoadError(true);
    });
    return () => { current = false; };
  }, [attempt]);

  const retry = useCallback(() => {
    setSnapshot(null);
    setLoadError(false);
    setAttempt(previous => previous + 1);
  }, []);

  const change = useCallback(async <T,>(work: (repo: Repository) => Promise<T>) => {
    if (writing.current) throw new Error('Дочекайтеся завершення попередньої дії.');
    writing.current = true;
    setBusy(true);
    try {
      const repo = await openRepository();
      const result = await work(repo);
      try {
        setSnapshot(await repo.snapshot());
      } catch (error) {
        console.warn('Не вдалося оновити каталог.', error);
        setLoadError(true);
      }
      return result;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }, []);

  return { snapshot, loadError, retry, busy, change };
}

export function messageFor(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('FOREIGN KEY')) return 'Цієї категорії більше немає. Виберіть іншу.';
    if (/[А-Яа-яІіЇїЄєҐґ]/.test(error.message)) return error.message;
  }
  return 'Спробуйте ще раз.';
}
