# JTDOS ALPHA 0.1 STAGING DEPLOYMENT GUIDE

## 1. Deployment Goal

Deploy JTDOS Alpha 0.1 from local development to a staging server so testers can access:

```text
https://staging.xxx.com/ai-booking
```

The staging goal is to validate:

Customer input -> order extraction -> real price-table quote -> booking request -> JTDSS test endpoint -> Email / Telegram / WhatsApp-link notification.

## 2. Environment Variables

Create a staging `.env` file on the server using `.env.example` as reference.

Required for real JTDSS mode:

```text
NODE_ENV=staging
JTDSS_API_BASE_URL=
JTDSS_API_KEY=
JTDSS_ORDER_ENDPOINT=/api/external/jtdos/orders
JTDSS_TIMEOUT_MS=10000
JTDSS_USE_MOCK=false
```

Notification and business settings:

```text
EMAIL_PROVIDER=
EMAIL_FROM=
EMAIL_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
PAYPAL_PAYMENT_LINK=
USD_JPY_RATE=
USD_RATE_SOURCE=manual
DEFAULT_TIMEZONE=Asia/Tokyo
```

Do not commit `.env`. Only `.env.example` should be committed.

## 3. Start Commands

Install is not required for Alpha 0.1 because the current server uses Node built-ins only.

Start local default mode:

```text
npm start
```

Start staging mode:

```text
npm run start:staging
```

Start production mode:

```text
npm run start:production
```

Run Alpha tests:

```text
npm run test:alpha
npm run test:staging
```

## 4. Health Check

Endpoint:

```http
GET /health
```

Expected response:

```json
{
  "success": true,
  "service": "JTDOS Alpha 0.1",
  "environment": "staging",
  "timestamp": "...",
  "jtdss_mode": "mock",
  "price_tables": {
    "hokkaido": true,
    "tokyo": true,
    "osaka": true
  }
}
```

## 5. AI Booking Page

Open:

```text
https://staging.xxx.com/ai-booking
```

The page should show:

- Chat input
- Chat message list
- Order summary panel
- Quote card
- Missing fields display
- Customer contact form
- Create Booking Request button
- Send to JTDSS button
- Success / error message display

## 6. Test Order Flow

Use this Tokyo test message:

```text
We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.
```

Expected:

- Extract order succeeds.
- Quote is `fixed_price`.
- Booking request is created.
- 20% deposit is calculated.
- Order is sent to JTDSS test endpoint.
- Notifications are triggered or skipped with warning if not configured.

## 7. Mock / Real JTDSS Switch

Use mock mode:

```text
JTDSS_USE_MOCK=true
```

Use real JTDSS client:

```text
NODE_ENV=staging
JTDSS_USE_MOCK=false
JTDSS_API_BASE_URL=...
JTDSS_API_KEY=...
```

In staging and production, the runtime selects the real JTDSS client unless `JTDSS_USE_MOCK=true`.

## 8. Logs

Check server logs for:

- JTDOS order ID
- JTDSS order ID
- JTDSS response status
- Notification warning messages
- Duplicate order errors

Logs must not expose:

- JTDSS API key
- Customer email
- Customer phone
- Customer WhatsApp
- LINE contact

Sensitive booking request fields should be masked in logs.

## 9. Rollback

If staging JTDSS integration fails:

1. Set `JTDSS_USE_MOCK=true`.
2. Restart the service.
3. Preserve booking requests locally.
4. Retry synchronization after operator review.
5. Restore the previous JSON price table if price-table regression is detected.

## 10. Pre-Launch Notes

Before public launch:

- Confirm real JTDSS API URL and API key.
- Confirm Email provider.
- Confirm Telegram private operation group.
- Confirm PayPal payment link.
- Confirm USD / JPY exchange rate.
- Run a real Tokyo order.
- Run a real Osaka order.
- Run a real Hokkaido ski order.
- Confirm duplicate order protection.
- Confirm notification failures do not block booking request creation.
- Confirm customer privacy fields are masked in logs.
