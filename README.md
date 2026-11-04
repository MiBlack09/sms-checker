# sms-checker

**Sms-checker** — проект по получению SMS-писем по номеру телефона и просмотру SMS-кода на рабочем месте (ноутбуке) через командную строку.

Условные номера для тестирования, с которых проверяется SMS:

- **ele2 / Altel:** `+77070707000`
- **Beeline Казахстан:** `+77059077000` (также используется старый стандартный формат `+79037011111`)
- **Kcell / activ:** `+77010002525` (и SMS-центры)

## Возможности

- Приём SMS через webhook-источник (`POST /api/sms`).
- Опрос SMS-шлюза через REST API (`HttpGatewaySource`).
- Единое хранилище SMS (JSON-файл `data/sms-store.json`).
- Извлечение SMS-кода из текста (например, `Ваш код подтверждения: 123456`).
- CLI-команда `sms-checker` — последний SMS, список, мониторинг новых SMS.

## Требования

- Node.js >= 18
- npm

## Установка

```bash
git clone https://github.com/MiBlack09/sms-checker.git sms-checker
cd sms-checker
npm install
cp .env.example .env
```

## Запуск

```bash
# API-сервер (порт 3000)
npm start

# В другом терминале — CLI
npm run cli -- latest
npm run cli -- --phone +77070707000 latest

# Или через npx / npm link
npx sms-checker latest
```

## Команды CLI

```bash
# Последнее SMS (по умолчанию для +77070707000)
sms-checker

# Список всех SMS
sms-checker list

# Мониторинг новых SMS (каждые 5 секунд)
sms-checker watch

# Отправить демо-SMS через API
sms-checker send --code 123456 --text "Ваш код: 123456"
# или
npm run demo -- 123456 "Ваш код подтверждения: 123456"
```

## Как приходит SMS

```
GSM-модем / SMS-шлюз
        │  POST /api/sms
        ▼
sms-checker API (Express)
        │
        ▼
SourceRegistry → SmsService → SmsStore → CLI / Веб
```

С payload'ом должно быть: `{ "phone": "+77070707000", "from": "...", "text": "Ваш код: 123456", "code": "123456" }`.

## Источники SMS

`SourceRegistry` рассылает входящее сообщение по всем зарегистрированным источникам без ограничений.

- `WebhookSource` — приём через `POST /api/sms`.
- `HttpGatewaySource` — подключение SMS-шлюза через REST API (опрос `GET {gatewayUrl}` + приём push).
- Для добавления новых источников (SMS-шлюзов, провайдеров, IMAP и т.п.) достаточно реализовать интерфейс `BaseSource` (`start`, `stop`, `receive`) и зарегистрировать его в `src/server.js`.

## SMS-шлюз через HTTP

Для подключения SMS-шлюза через REST API:

1. Укажи переменные окружения в `.env`:
```
SMS_GATEWAY_URL=https://your-gateway.example.com/api/sms
SMS_GATEWAY_API_KEY=your-key
SMS_GATEWAY_POLL_INTERVAL_MS=30000
```
2. При запуске (`npm start`) при наличии `SMS_GATEWAY_URL` регистрируется `HttpGatewaySource`, который опрашивает `GET {SMS_GATEWAY_URL}` (с заголовком `Authorization: Bearer {SMS_GATEWAY_API_KEY}`) и обрабатывает входящие SMS.
3. Полученные SMS попадают в общую цепочку: sources → service → store → CLI.

## Тесты

```bash
npm test
```

## Структура проекта

```
sms-checker/
├── bin/sms-checker.js        # CLI-команда
├── public/index.html         # веб-интерфейс
├── scripts/demo.js           # демо-SMS
├── src/
│   ├── server.js             # Express API + wiring
│   ├── service.js            # бизнес-логика
│   ├── store.js              # JSON-хранилище
│   ├── smsUtils.js           # нормализация номеров/кодов
│   └── sources/              # источники SMS
├── tests/                    # тесты
├── .github/workflows/        # CI
├── .env.example
└── package.json
```

## API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/health` | Статус, номер, источники |
| GET | `/api/sms?phone=...` | Все SMS (опционально фильтр по номеру) |
| GET | `/api/sms/latest?phone=...` | Последний SMS |
| POST | `/api/sms` | Приём SMS (webhook) |

Пример приёма SMS:

```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "+77070707000", "text": "Ваш код подтверждения: 123456", "source": "webhook"}'
```
