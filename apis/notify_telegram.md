# API DESIGN: NOTIFY TELEGRAM

## 1. Endpoint

```http
POST /api/notify/telegram
```

## 2. Purpose

Send Telegram notification to internal operation group when a JTDOS order is created or received by JTDSS.

## 3. Input

```json
{
  "event_type": "new_order_received",
  "telegram_chat_id": "",
  "order": {
    "jtdos_order_id": "JTDOS-20260601-0001",
    "jtdss_order_id": "JTDSS-000123",
    "service_type": "airport_pickup",
    "region": "Tokyo",
    "pickup_location": "Haneda Airport",
    "dropoff_location": "Shinjuku, Tokyo",
    "pickup_date": "2026-06-01",
    "pickup_time": "14:30",
    "passenger_count": 4,
    "luggage_count": 4,
    "vehicle_type": "Alphard/Vellfire",
    "price_jpy": 18000,
    "customer_name": "Test Customer",
    "customer_contact": "+000000000",
    "operator_review_required": false,
    "jtdss_order_url": "https://example.com/orders/JTDSS-000123"
  }
}
```

## 4. Telegram Message Template

```text
🚐 New JTDOS Order

Order: {{jtdos_order_id}}
JTDSS: {{jtdss_order_id}}

Service: {{service_type}}
Region: {{region}}
Route: {{pickup_location}} → {{dropoff_location}}
Date/Time: {{pickup_date}} {{pickup_time}}

Pax/Luggage: {{passenger_count}} / {{luggage_count}}
Vehicle: {{vehicle_type}}
Price: ¥{{price_jpy}}

Customer: {{customer_name}}
Contact: {{customer_contact}}

Review Required: {{operator_review_required}}

Open in JTDSS:
{{jtdss_order_url}}
```

## 5. Output

```json
{
  "success": true,
  "message": "Telegram notification sent."
}
```

## 6. Environment Variables

```text
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 7. Alpha 0.1 Rule

Telegram is suitable for internal operation notification.

Do not send sensitive customer data to public groups.

Only use private internal operation group.
