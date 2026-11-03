'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { WebhookSource } = require('../../src/sources/webhook');

const source = new WebhookSource();

test('webhook source возвращает null, если нет номера телефона', async () => {
  assert.equal(await source.receive({}), null);
});

test('webhook source нормализует входящее sms', async () => {
  const sms = await source.receive({ phone: '87001355000', text: 'Ваш код: 123456', source: 'webhook' });
  assert.equal(sms.phone, '+77001355000');
  assert.equal(sms.code, '123456');
  assert.equal(sms.source, 'webhook');
});
