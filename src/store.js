'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { normalizePhone } = require('./smsUtils');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'sms-store.json');

function readState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    if (parsed && Array.isArray(parsed.messages)) return parsed;
  } catch {
    // ignore corrupted / missing file
  }
  return { messages: [] };
}

function writeState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(state, null, 2));
}

class SmsStore {
  constructor() {
    this.state = readState();
  }

  list(phone) {
    const normalized = phone ? normalizePhone(phone) : null;
    const all = normalized
      ? this.state.messages.filter((m) => m.phone === normalized)
      : [...this.state.messages];
    return all.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  }

  latest(phone) {
    const list = this.list(phone);
    return list.length ? list[0] : null;
  }

  add(sms) {
    this.state.messages.push(sms);
    writeState(this.state);
    return sms;
  }

  clear(phone) {
    const normalized = phone ? normalizePhone(phone) : null;
    const before = this.state.messages.length;
    this.state.messages = normalized
      ? this.state.messages.filter((m) => m.phone !== normalized)
      : [];
    writeState(this.state);
    return before - this.state.messages.length;
  }
}

module.exports = new SmsStore();
module.exports.SmsStore = SmsStore;
