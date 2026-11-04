'use strict';

const BaseSource = require('./base');
const { normalizeSms } = require('../smsUtils');

/**
 * HTTP SMS Gateway source.
 * - receive(raw)  — приём SMS через push (шлюз делает запрос к нашему endpoint).
 * - fetchBatch()  — опрос REST API шлюза для получения входящих SMS.
 */
class HttpGatewaySource extends BaseSource {
  constructor(config = {}) {
    super({
      id: config.id || 'http-gateway',
      name: config.name || 'HTTP SMS Gateway',
      config,
    });
  }

  get gatewayUrl() {
    return this.config.gatewayUrl;
  }

  get apiKey() {
    return this.config.apiKey;
  }

  async receive(raw = {}) {
    const sms = normalizeSms(raw);
    return sms && sms.phone ? sms : null;
  }

  async fetchBatch() {
    const url = this.gatewayUrl;
    if (!url) return [];
    const headers = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.messages || [];
    const messages = [];
    for (const raw of list) {
      const sms = normalizeSms(raw);
      if (sms && sms.phone) messages.push(sms);
    }
    return messages;
  }
}

module.exports = { HttpGatewaySource };
