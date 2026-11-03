'use strict';

const EventEmitter = require('node:events');

/**
 * Реестр источников SMS.
 * Получает сырые сообщения и рассылает их по всем зарегистрированным источникам.
 */
class SourceRegistry extends EventEmitter {
  constructor() {
    super();
    this.sources = new Map();
  }

  register(source) {
    if (this.sources.has(source.id)) {
      throw new Error(`Source with id "${source.id}" is already registered`);
    }
    this.sources.set(source.id, source);
    if (source.start) source.start();
    return this;
  }

  unregister(sourceOrId) {
    const id = typeof sourceOrId === 'string' ? sourceOrId : sourceOrId?.id;
    return this.sources.delete(id);
  }

  get all() {
    return [...this.sources.values()];
  }

  async receive(raw) {
    const sources = this.all;
    const settled = await Promise.allSettled(
      sources.map(async (source) => ({ source, sms: await source.receive(raw) })),
    );
    const messages = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        const { sms } = result.value;
        if (sms) messages.push(sms);
      }
    }
    return messages;
  }
}

module.exports = { SourceRegistry };
