'use strict';

const DEFAULT_PHONE = process.env.SMS_CHECKER_PHONE || '87001355000';

/**
 * Приводит номер телефона к виду E.164 (+7 700 135 5000).
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  if (phone === undefined || phone === null) return '';
  let p = String(phone).trim().replace(/[\s\-().]/g, '');
  if (p.startsWith('00')) p = `+${p.slice(2)}`;
  if (p.startsWith('8') && p.length === 11) p = `7${p.slice(1)}`;
  if (p && !p.startsWith('+')) p = `+${p}`;
  return p;
}

/**
 * Извлекает SMS-код из текста (например, "Ваш код: 123456").
 * @param {string} text
 * @param {string} [fallback] код из payload'а источника
 * @returns {string|null}
 */
function extractCode(text, fallback) {
  const source = text || '';
  const patterns = [
    /(?:код|code|token|otp|pass|confirm|verification|magic|pin)[^\d]{0,20}(\d{4,8})/i,
    /(\d{4,8})/,
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match && match[1]) return match[1];
  }
  return fallback || null;
}

/**
 * Приводит сырой payload источника к единому виду SMS.
 * @param {Object} raw
 * @returns {Object}
 */
function normalizeSms(raw) {
  const payload = raw || {};
  const phone = normalizePhone(payload.phone);
  const text = payload.text ?? payload.body ?? payload.message ?? '';
  const code = payload.code ? String(payload.code) : extractCode(text);
  return {
    id: payload.id || `sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phone,
    from: payload.from || payload.sender || payload.fromNumber || 'unknown',
    text,
    code: code || null,
    receivedAt: payload.receivedAt ? new Date(payload.receivedAt).toISOString() : new Date().toISOString(),
    source: payload.source || 'unknown',
  };
}

module.exports = { DEFAULT_PHONE, normalizePhone, extractCode, normalizeSms };
