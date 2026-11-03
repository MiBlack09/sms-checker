#!/usr/bin/env node
'use strict';

const API_URL = (process.env.SMS_CHECKER_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const phone = process.env.SMS_CHECKER_PHONE || '87001355000';

async function main() {
  const code = process.argv[2] || String(Math.floor(100000 + Math.random() * 900000));
  const text = process.argv[3] || `Ваш код подтверждения: ${code}`;
  const res = await fetch(`${API_URL}/api/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, text, code, source: 'demo-script' }),
  });
  const data = await res.json();
  console.log('Демо-SMS отправлен:', JSON.stringify(data));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
