'use strict';

const BaseSource = require('./base');
const { normalizeSms } = require('../smsUtils');

class WebhookSource extends BaseSource {
  constructor(config = {}) {
    super({ id: 'webhook', name: 'SMS Gateway Webhook', config });
  }

  receive(raw = {}) {
    const sms = normalizeSms(raw);
    return sms && sms.phone ? sms : null;
  }
}

module.exports = { WebhookSource };
