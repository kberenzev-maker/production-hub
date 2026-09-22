# 🎬 Production Hub — Multi-tenant Telegram Bot & Mini App

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kberenzev-maker/production-hub)

Автоматизированный конвейер производства контента (Reels, Карусели, Сторис) для продюсеров и экспертов с интеграцией в Telegram супергруппы (9 топиков), записью идей через ЛС бота, встроенным плеером войсов и персональными напоминаниями о созвонах.

---

## 🚀 Архитектура облачного деплоя (Render.com)

Файл `render.yaml` автоматически разворачивает два независимых контура:

1. **🔴 Production (Боевой контур)**:
   - Ветка: `main`
   - Хост: `https://prodhub-production.onrender.com`
   - Бот: боевой бот `@content_production_hub_bot`
2. **🟡 Staging / Test (Тестовый контур)**:
   - Ветка: `stage`
   - Хост: `https://prodhub-staging.onrender.com`
   - Бот: тестовый бот для проверки новых релизов

---

## ⚙️ Переменные окружения (Environment Variables)

| Переменная | Описание |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен бота от `@BotFather` |
| `APP_URL` | Публичный HTTPS URL приложения (напр. `https://prodhub-production.onrender.com`) |
| `GEMINI_API_KEY` | (Опционально) Ключ Google Gemini для AI-транскрибации войсов |
| `PORT` | Порт сервера (по умолчанию `3000`) |

---

## 🛠️ Локальный запуск

```bash
# Установка зависимостей
bun install

# Запуск в режиме разработки
bun run dev

# Сборка и запуск продакшн сервера
bun run build
bun run start
```
