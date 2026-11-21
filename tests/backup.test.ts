import assert from 'node:assert/strict';
import { test } from 'node:test';
import { backupFormat, parseBackup, type InventoryBackup } from '../src/backupFormat.ts';

const backup: InventoryBackup = {
  format: backupFormat,
  version: 1,
  categories: ['Дім', 'Інструменти'],
  items: [{
    name: 'Ліхтар', categoryIndex: 1, location: 'Шафа', description: '',
    favorite: true, createdAt: '2026-11-21T10:00:00.000Z',
    photo: { extension: 'jpg', base64: '/9j/' },
  }],
};

test('a versioned backup round-trips including photo data and favorites', () => {
  assert.deepEqual(parseBackup(JSON.stringify(backup)), backup);
  assert.deepEqual(parseBackup(JSON.stringify({ ...backup, categories: [], items: [] })).items, []);
});

test('invalid versions, categories, references and photo values are rejected', () => {
  const [item] = backup.items;
  for (const invalid of [
    { ...backup, version: 2 },
    { ...backup, categories: [' Дім ', 'ДІМ'] },
    { ...backup, items: [{ ...item, categoryIndex: 2 }] },
    { ...backup, items: [{ ...item, createdAt: 'tomorrow' }] },
    { ...backup, items: [{ ...item, favorite: 1 }] },
    { ...backup, items: [{ ...item, photo: { extension: '../jpg', base64: '/9j/' } }] },
    { ...backup, items: [{ ...item, photo: { extension: 'jpg', base64: '&*!?' } }] },
  ]) {
    assert.throws(() => parseBackup(JSON.stringify(invalid)), /резервною копією/);
  }
  assert.throws(() => parseBackup('{'), /резервною копією/);
});
