'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { HttpGatewaySource } = require('../../src/sources/httpGateway');

test('http gateway source нормализует push sms', async () => {
  const source = new HttpGatewaySource({});
  const sms = await source.receive({ phone: '77070707000', text: 'Ваш код: 123456', source: 'http-gateway' });
  assert.equal(sms.phone, '+77070707000');
  assert.equal(sms.code, '123456');
  assert.equal(sms.source, 'http-gateway');
});

test('http gateway source возвращает null, если нет номера телефона', async () => {
  const source = new HttpGatewaySource({});
  assert.equal(await source.receive({}), null);
});

test('http gateway source fetchBatch получает sms из REST API шлюза', async () => {
  const source = new HttpGatewaySource({ gatewayUrl: 'http://127.0.0.1:9/api/sms', apiKey: 'secret' });
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ messages: [{ phone: '77070707000', text: 'Ваш код: 654321', source: 'http-gateway' }] }),
  });
  try {
    const batch = await source.fetchBatch();
    assert.equal(batch.length, 1);
    assert.equal(batch[0].code, '654321');
    assert.equal(batch[0].source, 'http-gateway');
  } finally {
    global.fetch = originalFetch;
  }
});

test('http gateway source fetchBatch возвращает пустой список без url', async () => {
  const source = new HttpGatewaySource({});
  assert.deepEqual(await source.fetchBatch(), []);
});
