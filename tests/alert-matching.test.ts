import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesAlert, type AlertForMatching, type ItemForMatching } from '../lib/alert-matching';

const item: ItemForMatching = {
  title: 'Blue Samsung A14',
  description: 'Found near the library entrance. Cracked screen.',
  categoryId: 'cat-phone',
  locationId: 'loc-library',
  isDocument: false,
  documentNumber: null,
  documentYear: null,
  issuingAuthority: null,
  holderName: null,
  color: 'blue',
};

const alert: AlertForMatching = {
  keywords: 'samsung',
  categoryId: null,
  locationId: null,
  isDocument: false,
  documentNumber: null,
  documentYear: null,
  issuingAuthority: null,
  holderName: null,
  color: null,
};

test('matches when every keyword appears in title or description', () => {
  assert.equal(matchesAlert({ ...alert, keywords: 'samsung blue' }, item), true);
  assert.equal(matchesAlert({ ...alert, keywords: 'SAMSUNG library' }, item), true);
});

test('does not match when any keyword is missing', () => {
  assert.equal(matchesAlert({ ...alert, keywords: 'samsung iphone' }, item), false);
});

test('category must match exactly when set on the alert', () => {
  assert.equal(matchesAlert({ ...alert, categoryId: 'cat-phone' }, item), true);
  assert.equal(matchesAlert({ ...alert, categoryId: 'cat-bag' }, item), false);
});

test('location must match exactly when set on the alert', () => {
  assert.equal(matchesAlert({ ...alert, locationId: 'loc-library' }, item), true);
  assert.equal(matchesAlert({ ...alert, locationId: 'loc-market' }, item), false);
});

test('colour must match when set on the alert', () => {
  assert.equal(matchesAlert({ ...alert, color: 'BLUE' }, item), true);
  assert.equal(matchesAlert({ ...alert, color: 'red' }, item), false);
});

test('colour alert does not match an item without a colour', () => {
  assert.equal(matchesAlert({ ...alert, color: 'blue' }, { ...item, color: null }), false);
});

test('document alerts require the item to be a document', () => {
  const docAlert = { ...alert, isDocument: true, documentNumber: '63-123456' };
  assert.equal(matchesAlert(docAlert, item), false);
  assert.equal(
    matchesAlert(docAlert, { ...item, isDocument: true, documentNumber: '63-123456X' }),
    true
  );
});

test('document fields are compared case-insensitively as substrings', () => {
  const docAlert = {
    ...alert,
    isDocument: true,
    documentNumber: '63-123456',
    holderName: 'tendai',
  };
  const docItem = {
    ...item,
    isDocument: true,
    documentNumber: '63-123456',
    holderName: 'Tendai Moyo',
  };
  assert.equal(matchesAlert(docAlert, docItem), true);
  assert.equal(
    matchesAlert({ ...docAlert, holderName: 'farai' }, docItem),
    false
  );
});

test('document alert requires an item value when the alert specifies one', () => {
  const docAlert = { ...alert, isDocument: true, documentNumber: '63-123456' };
  assert.equal(
    matchesAlert(docAlert, { ...item, isDocument: true, documentNumber: null }),
    false
  );
});

test('document fields on a non-document alert are ignored', () => {
  assert.equal(
    matchesAlert({ ...alert, documentNumber: '63-123456' }, item),
    true
  );
});

test('empty keywords match everything (guarded upstream by validation)', () => {
  assert.equal(matchesAlert({ ...alert, keywords: '   ' }, item), true);
});
