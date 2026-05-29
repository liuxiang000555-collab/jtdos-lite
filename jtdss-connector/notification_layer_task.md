# JTDSS JTDOS Notification Layer Task

## 1. Goal

Implement the JTDOS order notification layer in the existing JTDSS backend.

When `POST /api/external/jtdos/orders` successfully creates a booking request, JTDSS should automatically trigger notifications.

AI-generated booking requests are not final confirmations. Operator Liu Xiang must confirm final price, vehicle availability, driver arrangement, and 20% PayPal deposit before formal dispatch.

## 2. References

Use these files as the source of truth:

- `jtdss-connector/notification_design.md`
- `apis/notify_email.md`
- `apis/notify_telegram.md`
- `apis/notify_whatsapp.md`
- `jtdss-connector/create_order_payload.json`
- `jtdss-connector/webhook_design.md`

## 3. Email Notification

Create:

```text
sendJtdosOrderEmailNotification(order)
```

Requirements:

- Use environment variables to configure the email provider.
- Support a simple provider first, such as Resend, SendGrid, SMTP, or AWS SES.
- If email provider is not configured, do not fail order creation.
- Log a warning when email is skipped or fails.
- If `operator_review_required = true`, include:

```text
⚠️ Operator review required before dispatch.
```

## 4. Telegram Notification

Create:

```text
sendJtdosOrderTelegramNotification(order)
```

Requirements:

- Use `TELEGRAM_BOT_TOKEN`.
- Use `TELEGRAM_CHAT_ID`.
- Send notification to an internal operation group.
- If Telegram is not configured, do not fail order creation.
- Log a warning when Telegram is skipped or fails.
- Do not send sensitive customer data to public groups.
- If `operator_review_required = true`, include:

```text
⚠️ Operator review required before dispatch.
```

## 5. WhatsApp Placeholder

Create:

```text
generateWhatsAppManualLink(order)
```

Requirements:

- If customer has WhatsApp, generate a `wa.me` manual sending link.
- Do not call WhatsApp Business API in Alpha 0.1.
- Save the manual link to the order record if the existing order model supports it.
- Otherwise, return it in the API response.
- WhatsApp failure or missing customer WhatsApp must not block order creation.

## 6. Order Creation Integration

After order creation succeeds:

1. Send Email notification.
2. Send Telegram notification.
3. Generate WhatsApp manual link.
4. Save or return notification results.

All notification failures must be non-blocking.

Order creation must still return success when notification providers are unavailable.

## 7. Suggested API Response Addition

```json
{
  "success": true,
  "jtdss_order_id": "JTDSS-000123",
  "jtdos_order_id": "JTDOS-TEST-0001",
  "status": "pending_operator_confirmation",
  "notification": {
    "email": "sent | skipped | failed",
    "telegram": "sent | skipped | failed",
    "whatsapp_manual_link": "https://wa.me/000000000?text=..."
  }
}
```

## 8. Required Tests

Add simple tests for:

- Email notification is called after successful order creation.
- Telegram notification is called after successful order creation.
- WhatsApp manual link is generated when customer WhatsApp exists.
- Missing email provider logs warning and does not fail order creation.
- Missing Telegram config logs warning and does not fail order creation.
- Email failure does not fail order creation.
- Telegram failure does not fail order creation.
- Operator review warning appears when `operator_review_required = true`.

## 9. Closed Loop Test Payload

Use this payload:

```json
{
  "jtdos_order_id": "JTDOS-TEST-0001",
  "source": "jtdos_ai_agent",
  "service_type": "airport_pickup",
  "region": "Tokyo",
  "status": "quote_generated",
  "route": {
    "pickup_location": "Haneda Airport",
    "dropoff_location": "Shinjuku, Tokyo",
    "arrival_airport": "HND",
    "flight_number": "JL000",
    "pickup_date": "2026-06-01",
    "pickup_time": "14:30",
    "timezone": "Asia/Tokyo"
  },
  "customer": {
    "name": "Test Customer",
    "country": "United States",
    "email": "test@example.com",
    "whatsapp": "+000000000",
    "preferred_language": "English"
  },
  "passenger": {
    "passenger_count": 4,
    "luggage_count": 4
  },
  "vehicle": {
    "vehicle_type": "Alphard/Vellfire"
  },
  "pricing": {
    "currency": "JPY",
    "price_jpy": 18000,
    "price_status": "fixed_price"
  },
  "metadata": {
    "operator_review_required": false
  }
}
```

Expected result:

1. JTDSS backend shows the order.
2. Email notification is sent, or logs show skipped/warning.
3. Telegram notification is sent, or logs show skipped/warning.
4. WhatsApp manual link is generated.
5. Order creation is not affected by notification failure.

## 10. Alpha 0.1 Boundary

Do not overbuild.

The notification layer only needs to make sure someone sees the new order quickly.
