#!/usr/bin/env node
'use strict';

const API_URL = (process.env.SMS_CHECKER_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const HELP_TEXT = [
  'sms-checker — получение SMS по номеру телефона',
  '',
  'Использование:',
  '  sms-checker [команда] [опции]',
  '',
  'Команды:',
  '  latest            Показать последнее SMS (по умолчанию)',
  '  list              Показать все SMS',
  '  watch             Смотреть за новыми SMS в реальном времени',
  '  send              Отправить демо-SMS через API',
  '  help              Показать справку',
  '',
  'Опции:',
  '  -p, --phone <n>   Номер телефона (по умолчанию: +77070707000)',
  '  -c, --code <n>     Код SMS (используется в send)',
  '  -t, --text <txt>   Текст SMS (используется в send)',
  '  -w, --watch        Смотреть за новыми SMS',
  '  -h, --help         Показать справку',
  '',
  'Переменные окружения:',
  '  SMS_CHECKER_PHONE      Номер по умолчанию',
  '  SMS_CHECKER_API_URL    Адрес API (по умолчанию http://localhost:3000)',
].join('\n');

function printHelp() {
  console.log(HELP_TEXT);
}

function parseArgs(argv) {
  const opts = {
    command: 'latest',
    phone: process.env.SMS_CHECKER_PHONE || '+77070707000',
    code: null,
    text: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-p' || arg === '--phone') {
      opts.phone = argv[i + 1] || opts.phone;
    } else if (arg.startsWith('--phone=')) {
      opts.phone = arg.slice('--phone='.length);
    } else if (arg === '-c' || arg === '--code') {
      opts.code = argv[i + 1];
    } else if (arg.startsWith('--code=')) {
      opts.code = arg.slice('--code='.length);
    } else if (arg === '-t' || arg === '--text') {
      opts.text = argv[i + 1];
    } else if (arg.startsWith('--text=')) {
      opts.text = arg.slice('--text='.length);
    } else if (arg === '-w' || arg === '--watch' || arg === 'watch') {
      opts.command = 'watch';
    } else if (arg === 'list' || arg === 'ls') {
      opts.command = 'list';
    } else if (arg === 'latest' || arg === 'get') {
      opts.command = 'latest';
    } else if (arg === 'send') {
      opts.command = 'send';
    } else if (arg === 'help' || arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }
  return opts;
}

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${body.error || body.message || 'unknown error'}`);
  }
  return body;
}

async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${data.error || data.message || 'unknown error'}`);
  }
  return data;
}

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '—';
  let core = digits;
  if (core.startsWith('8') && core.length === 11) core = `7${core.slice(1)}`;
  const national = core.startsWith('7') ? core.slice(1) : core;
  const parts = [];
  if (national.length > 3) {
    parts.push(national.slice(0, 3));
    const rest = national.slice(3);
    if (rest.length > 3) {
      parts.push(rest.slice(0, 3));
      parts.push(rest.slice(3));
    } else {
      parts.push(rest);
    }
  } else {
    parts.push(national);
  }
  const grouped = parts.join(' ');
  if (core.startsWith('7')) return `+7 ${grouped}`;
  return `+${core}`;
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function printSms(sms) {
  console.log('📩 SMS:');
  console.log(`   От:    ${sms.from}`);
  console.log(`   Код:   ${sms.code || '—'}`);
  console.log(`   Текст: ${sms.text}`);
  console.log(`   Время: ${formatTime(sms.receivedAt)}`);
  console.log(`   ID:    ${sms.id}`);
}

async function cmdLatest(opts) {
  const { sms } = await apiGet(`/api/sms/latest?phone=${encodeURIComponent(opts.phone)}`);
  if (!sms) {
    console.log(`SMS для номера ${formatPhone(opts.phone)} пока не получен.`);
    process.exitCode = 1;
    return;
  }
  console.log(`Номер: ${formatPhone(sms.phone)}`);
  printSms(sms);
}

async function cmdList(opts) {
  const { messages } = await apiGet(`/api/sms?phone=${encodeURIComponent(opts.phone)}`);
  const list = messages || [];
  if (list.length === 0) {
    console.log(`SMS для номера ${formatPhone(opts.phone)} пока не получен.`);
    process.exitCode = 1;
    return;
  }
  for (const sms of list) printSms(sms);
}

async function cmdWatch(opts) {
  const seen = new Set();
  let timer = null;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    try {
      const { sms } = await apiGet(`/api/sms/latest?phone=${encodeURIComponent(opts.phone)}`);
      if (!sms) return;
      if (seen.has(sms.id)) return;
      seen.add(sms.id);
      console.log('📩 Новое SMS:');
      console.log(`   От:    ${sms.from}`);
      console.log(`   Код:   ${sms.code || '—'}`);
      console.log(`   Текст: ${sms.text}`);
      console.log(`   Время: ${formatTime(sms.receivedAt)}`);
    } catch {
      // ignore polling errors
    }
  };

  await poll();
  timer = setInterval(() => {
    void poll();
  }, 5000);

  const shutdown = () => {
    stopped = true;
    if (timer) clearInterval(timer);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function cmdSend(opts) {
  const code = opts.code || String(Math.floor(100000 + Math.random() * 900000));
  const text = opts.text || `Ваш код подтверждения: ${code}`;
  const data = await apiPost('/api/sms', { phone: opts.phone, text, code, source: 'cli' });
  const messages = data.messages || [];
  const sms = messages[messages.length - 1];
  if (!sms) {
    console.log('Демо-SMS отправлен, но SMS не удалось обработать.');
    return;
  }
  console.log('✅ Демо-SMS отправлен:');
  printSms(sms);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.command === 'help') {
    printHelp();
    return;
  }
  if (opts.command === 'send') {
    await cmdSend(opts);
    return;
  }
  if (opts.command === 'watch') {
    await cmdWatch(opts);
    return;
  }
  if (opts.command === 'list') {
    await cmdList(opts);
    return;
  }
  await cmdLatest(opts);
}

main().catch((err) => {
  console.error(`❌ Ошибка: ${err.message}`);
  process.exit(1);
});
