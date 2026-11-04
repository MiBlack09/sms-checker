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

  start() {
    this.intervals = [];
    for (const source of this.all) {
      source.start();
      if (typeof source.fetchBatch === 'function' && source.config && source.config.gatewayUrl) {
        const interval = setInterval(async () => {
          try {
            const batch = await source.fetchBatch();
            for (const sms of batch) this.emit('message', sms);
          } catch {
            // ignore polling errors
          }
        }, source.config.pollIntervalMs || 30000);
        interval.unref?.();
        this.intervals.push(interval);
      }
    }
    return this;
  }

  stop() {
    for (const timer of this.intervals || []) clearInterval(timer);
    this.intervals = [];
    for (const source of this.all) source.stop();
    return this;
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
