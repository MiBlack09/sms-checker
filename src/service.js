'use strict';

const store = require('./store');
const { normalizeSms } = require('./smsUtils');

class SmsService {
  ingest(raw = {}) {
    const sms = normalizeSms(raw);
    return store.add(sms);
  }

  list(phone) {
    return store.list(phone);
  }

  latest(phone) {
    return store.latest(phone);
  }

  clear(phone) {
    return store.clear(phone);
  }
}

module.exports = new SmsService();
module.exports.SmsService = SmsService;
