# API DESIGN: NOTIFY WHATSAPP

## 1. Endpoint

```http
POST /api/notify/whatsapp
```

## 2. Purpose

Prepare WhatsApp notification or manual WhatsApp contact link for customer or operator.

Alpha 0.1 does not require full WhatsApp Business API integration.

## 3. Alpha 0.1 Mode

Generate manual WhatsApp link:

```text
https://wa.me/{{customer_whatsapp}}?text={{encoded_message}}
```

## 4. Input

```json
{
  "event_type": "booking_request_created",
  "customer_whatsapp": "+000000000",
  "order": {
    "jtdos_order_id": "JTDOS-20260601-0001",
    "service_type": "airport_pickup",
    "pickup_location": "Haneda Airport",
    "dropoff_location": "Shinjuku, Tokyo",
    "pickup_date": "2026-06-01",
    "pickup_time": "14:30",
    "vehicle_type": "Alphard/Vellfire",
    "price_jpy": 18000
  }
}
```

## 5. Message Template

```text
Hello, thank you for your booking request.

Order ID: {{jtdos_order_id}}
Service: {{service_type}}
Route: {{pickup_location}} → {{dropoff_location}}
Date/Time: {{pickup_date}} {{pickup_time}}
Vehicle: {{vehicle_type}}
Estimated Price: ¥{{price_jpy}}

We will confirm vehicle availability and final details shortly.
```

## 6. Output

```json
{
  "success": true,
  "whatsapp_manual_link": "https://wa.me/000000000?text=..."
}
```

## 7. Production Options

Future production version can integrate:

- WhatsApp Business API
- Twilio
- 360dialog
- WATI
- Other approved provider

## 8. Alpha 0.1 Rule

Do not block order creation if WhatsApp notification fails.

WhatsApp is optional in Alpha 0.1.
