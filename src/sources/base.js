'use strict';

class BaseSource {
  constructor({ id, name, config } = {}) {
    this.id = id;
    this.name = name;
    this.config = config || {};
  }

  start() {
    return Promise.resolve();
  }

  stop() {
    return Promise.resolve();
  }

  receive(raw) {
    return Promise.resolve(null);
  }

  // Для источников, опрашивающих шлюз через REST API (например, /incoming).
  fetchBatch() {
    return Promise.resolve([]);
  }
}

module.exports = BaseSource;
