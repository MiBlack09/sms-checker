'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { SmsService } = require('../src/service');

const service = new SmsService();

test('ingest сохраняет sms и возвращает его с кодом', () => {
  service.clear('87001355000');
  const saved = service.ingest({ phone: '87001355000', text: 'Ваш код подтверждения: 123456' });
  assert.ok(saved.id);
  assert.equal(saved.code, '123456');
  assert.equal(saved.phone, '+77001355000');
});

test('latest возвращает последний sms для номера', () => {
  service.clear('87001355000');
  service.ingest({ phone: '87001355000', text: 'Ваш код: 111222' });
  const latest = service.latest('87001355000');
  assert.equal(latest.code, '111222');
});

test('list фильтрует сообщения по номеру телефона', () => {
  service.clear('87001355000');
  service.ingest({ phone: '87001355000', text: 'Ваш код: 111222' });
  service.ingest({ phone: '88001355001', text: 'SMS для другого номера' });
  const list = service.list('87001355000');
  assert.equal(list.length, 1);
});
