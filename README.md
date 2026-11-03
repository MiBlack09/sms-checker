# sms-checker

**Sms-checker** — проект по получению SMS-писем по номеру телефона и просмотру SMS-кода на рабочем месте (ноутбуке) через командную строку.

Условный номер, с которого проверяется SMS: **`87001355000`** (принимаем в формате `8...`, `+7...`, `00...` — автоматически нормализуется).

## Возможности

- Приём SMS через webhook-источник (`POST /api/sms`).
- Единое хранилище SMS (JSON-файл `data/sms-store.json`).
- Извлечение SMS-кода из текста (например, `Ваш код подтверждения: 123456`).
- CLI-команда `sms-checker` — последний SMS, список, мониторинг новых SMS.
- Веб-интерфейс в `public/index.html` (доступен через API-сервер).

## Требования

- Node.js >= 18
- npm

## Установка

```bash
git clone <ваш-репозиторий> sms-checker
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
npm run cli -- --phone 87001355000 latest

# Или через npx / npm link
npx sms-checker latest
```

## Команды CLI

```bash
# Последнее SMS для номера 87001355000
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

Реальный SMS приходит на телефон (через GSM-модем / шлюз), а шлюз (например, через webhook) отправляет его на backend:

```
GSM-модем / SMS-шлюз
        │  POST /api/sms
        ▼
sms-checker API (Express)
        │
        ▼
SourceRegistry → SmsService → SmsStore → CLI / Веб
```

С payload'ом должно быть: `{ "phone": "87001355000", "from": "...", "text": "Ваш код: 123456", "code": "123456" }`.

## Источники SMS

`SourceRegistry` рассылает входящее сообщение по всем зарегистрированным источникам без ограничений.

- `WebhookSource` — приём через `POST /api/sms`.
- Для добавления новых источников (SMS-шлюзов, провайдеров, IMAP и т.п.) достаточно реализовать интерфейс `BaseSource` (`start`, `stop`, `receive`) и зарегистрировать его в `src/server.js`.

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
  -d '{"phone": "87001355000", "text": "Ваш код подтверждения: 123456", "source": "webhook"}'
```
