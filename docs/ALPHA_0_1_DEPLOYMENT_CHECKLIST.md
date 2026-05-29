# JTDOS ALPHA 0.1 DEPLOYMENT CHECKLIST

## 1. JTDSS API Configuration

- Set `JTDSS_API_BASE_URL`.
- Set `JTDSS_API_KEY`.
- Set `JTDSS_ORDER_ENDPOINT=/api/external/jtdos/orders`.
- Confirm the endpoint accepts Bearer API Key authentication.
- Confirm duplicate `jtdos_order_id` returns a duplicate-order error.

## 2. Email Configuration

- Set `EMAIL_PROVIDER`.
- Set `EMAIL_FROM`.
- Set `EMAIL_API_KEY`.
- Confirm missing email config only logs warning and does not block order creation.

## 3. Telegram Configuration

- Set `TELEGRAM_BOT_TOKEN`.
- Set `TELEGRAM_CHAT_ID`.
- Confirm the chat is a private internal operation group.
- Confirm missing Telegram config only logs warning and does not block order creation.

## 4. PayPal Link Configuration

- Set `PAYPAL_PAYMENT_LINK`.
- Confirm booking request copy states 20% deposit.
- Confirm payment link is not exposed before customer accepts the quote.

## 5. USD / JPY Rate Configuration

- Set `USD_JPY_RATE`.
- Set `USD_RATE_SOURCE=manual` for Alpha 0.1.
- Confirm JPY is the primary price and USD is reference only.

## 6. Real Order Test

- Run a Tokyo airport pickup booking request.
- Run an Osaka / Kansai airport pickup booking request.
- Run a Hokkaido ski airport pickup booking request.
- Confirm JTDSS receives each order.
- Confirm JTDSS status mapping is correct.

## 7. Duplicate Order Test

- Send the same `jtdos_order_id` twice.
- Confirm the second request is rejected.
- Confirm the first booking request is preserved locally.

## 8. Notification Failure Test

- Disable Email config.
- Disable Telegram config.
- Confirm order creation still succeeds.
- Confirm warning is logged or returned.
- Confirm WhatsApp manual link can still be generated when customer WhatsApp exists.

## 9. Customer Privacy Field Check

- Do not expose customer contact details publicly.
- Do not log unnecessary sensitive data.
- Store customer email, WhatsApp, LINE, and phone securely.
- Telegram notifications must be sent only to internal private groups.

## 10. Log Check

- Log JTDOS order ID.
- Log JTDSS order ID.
- Log JTDSS response status.
- Log notification skip warnings.
- Avoid logging raw API keys or PayPal credentials.

## 11. Rollback Plan

- Keep `backend/jtdss/mock_jtdss.js` for test fallback.
- Set `JTDSS_USE_MOCK=true` to use the mock client outside production.
- If production JTDSS API fails, preserve booking request locally and retry after operator review.
- Keep the previous real price JSON files available for rollback.
