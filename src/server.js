'use strict';

const path = require('node:path');
const express = require('express');
const { SmsService } = require('./service');
const { SourceRegistry } = require('./sources');
const { WebhookSource } = require('./sources/webhook');
const { HttpGatewaySource } = require('./sources/httpGateway');

const service = new SmsService();
const registry = new SourceRegistry();
registry.register(new WebhookSource());
if (process.env.SMS_GATEWAY_URL) {
  registry.register(
    new HttpGatewaySource({
      gatewayUrl: process.env.SMS_GATEWAY_URL,
      apiKey: process.env.SMS_GATEWAY_API_KEY,
    }),
  );
}
registry.on('message', (sms) => service.ingest(sms));

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    phone: process.env.SMS_CHECKER_PHONE || '+77070707000',
    sources: registry.all.map((s) => ({ id: s.id, name: s.name })),
  });
});

app.get('/api/sms', (req, res) => {
  const phone = req.query.phone;
  res.json({ phone: phone || null, messages: service.list(phone) });
});

app.get('/api/sms/latest', (req, res) => {
  const phone = req.query.phone;
  res.json({ sms: service.latest(phone) });
});

app.post('/api/sms', async (req, res) => {
  const messages = await registry.receive(req.body || {});
  const ingested = [];
  for (const sms of messages) {
    ingested.push(service.ingest(sms));
  }
  res.status(201).json({ ok: true, messages: ingested });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => {
  console.log(`sms-checker API: http://localhost:${PORT}`);
  registry.start();
});

const shutdown = () => {
  registry.stop();
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, service, registry, server };
