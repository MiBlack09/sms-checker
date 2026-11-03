'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { SourceRegistry } = require('../../src/sources');
const BaseSource = require('../../src/sources/base');

class FakeSource extends BaseSource {
  constructor(id, sms) {
    super({ id, name: id });
    this.sms = sms;
  }

  async receive() {
    return this.sms;
  }
}

test('registry собирает sms от всех источников', async () => {
  const registry = new SourceRegistry();
  registry.register(new FakeSource('source-a', { id: 'sms-1', phone: '+77001355000', text: 'a', code: '111222', from: 'x', receivedAt: new Date().toISOString(), source: 'source-a' }));
  registry.register(new FakeSource('source-b', null));
  const messages = await registry.receive({ phone: '87001355000' });
  assert.equal(messages.length, 1);
});

test('registry запрещает дублирование источника и удаляет его', () => {
  const registry = new SourceRegistry();
  registry.register(new FakeSource('dup', null));
  assert.throws(() => registry.register(new FakeSource('dup', null)), /already registered/);
  registry.unregister('dup');
  assert.equal(registry.all.length, 0);
});
