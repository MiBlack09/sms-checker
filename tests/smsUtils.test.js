'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { normalizePhone, extractCode, normalizeSms } = require('../src/smsUtils');

test('normalizePhone приводит номер к E.164 (8 → +7)', () => {
  assert.equal(normalizePhone('77070707000'), '+77070707000');
});

test('normalizePhone оставляет номер с плюсом без изменений', () => {
  assert.equal(normalizePhone('+77070707000'), '+77070707000');
});

test('normalizePhone убирает пробелы, дефисы и скобки', () => {
  assert.equal(normalizePhone('+7 (707) 070-7000'), '+77070707000');
});

test('extractCode находит код после ключевого слова', () => {
  assert.equal(extractCode('Ваш код подтверждения: 123456'), '123456');
});

test('extractCode использует fallback, если код не найден в тексте', () => {
  assert.equal(extractCode('Вход в аккаунт', '654321'), '654321');
});

test('normalizeSms строит полный объект смс', () => {
  const sms = normalizeSms({ phone: '77070707000', text: 'Ваш код: 123456', source: 'webhook' });
  assert.equal(sms.phone, '+77070707000');
  assert.equal(sms.code, '123456');
  assert.equal(sms.source, 'webhook');
  assert.ok(sms.id);
  assert.ok(sms.receivedAt);
});
