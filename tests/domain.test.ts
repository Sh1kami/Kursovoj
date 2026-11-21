import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterItems, normalizeName, validateCategory, validateItem } from '../src/domain.ts';
import type { Item } from '../src/types.ts';

const input = { name: '  Ліхтар  ', categoryId: 1, location: '  Шафа  ', description: '' };

test('item validation trims text and rejects invalid required fields and limits', () => {
  assert.deepEqual(validateItem(input), { ...input, name: 'Ліхтар', location: 'Шафа' });
  assert.throws(() => validateItem({ ...input, name: '  ' }), /назву/);
  assert.throws(() => validateItem({ ...input, categoryId: null }), /категорію/);
  assert.throws(() => validateItem({ ...input, categoryId: 0.5 }), /категорію/);
  assert.throws(() => validateItem({ ...input, location: 'а'.repeat(151) }), /150/);
  assert.throws(() => validateItem({ ...input, description: 'а'.repeat(1001) }), /1000/);
});

test('category validation trims names and enforces length', () => {
  assert.equal(validateCategory('  Одяг  '), 'Одяг');
  assert.throws(() => validateCategory(' '), /назву/);
  assert.throws(() => validateCategory('а'.repeat(51)), /50/);
});

test('Ukrainian substring and category filters combine', () => {
  const base = { categoryName: '', location: '', description: '', photoName: null, createdAt: '' };
  const items: Item[] = [
    { ...base, id: 1, name: 'Сувенір з Їжаком', categoryId: 1 },
    { ...base, id: 2, name: 'ЇЖАК', categoryId: 2 },
    { ...base, id: 3, name: 'Ґудзик', categoryId: 1 },
  ];
  assert.deepEqual(filterItems(items, ' їжАК ', null).map(item => item.id), [1, 2]);
  assert.deepEqual(filterItems(items, 'ЇЖАК', 2).map(item => item.id), [2]);
  assert.deepEqual(filterItems(items, '', 1).map(item => item.id), [1, 3]);
  assert.deepEqual(filterItems(items, 'єнот', null), []);
  assert.equal(normalizeName(' Об’єктив '), normalizeName("об'єктив"));
  assert.equal(normalizeName('Ї'), normalizeName('І\u0308'));
});
