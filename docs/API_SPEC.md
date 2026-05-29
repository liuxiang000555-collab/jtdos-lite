# JTDOS API SPEC

## 1. Purpose

This document defines the first API structure for JTDOS Alpha 0.1.

The API must allow an AI Agent, partner website, or internal system to create transportation orders and send them to the existing JTDSS backend.

## 2. Core Alpha 0.1 API Flow

Customer inquiry
-> AI Agent extracts travel information
-> API generates quote
-> API creates order
-> Operator Liu Xiang confirms final price, vehicle availability, driver arrangement, and deposit
-> API sends or synchronizes confirmed order to JTDSS
-> API sends backup notification by Email / WhatsApp / Telegram

## 3. API List

Alpha 0.1 should include the following APIs:

1. `POST /api/agent/extract-order`
2. `POST /api/quote/generate`
3. `POST /api/order/create`
4. `POST /api/jtdss/send-order`
5. `POST /api/notify/email`
6. `POST /api/notify/whatsapp`
7. `POST /api/notify/telegram`

## 4. API: Extract Order

### Endpoint

```http
POST /api/agent/extract-order
```

### Purpose

Extract structured order information from customer text.

### Input Example

```json
{
  "customer_message": "We are 4 people arriving at Haneda Airport on May 20 at 14:30. We need a van to Shinjuku hotel. We have 4 suitcases and prefer a Chinese-speaking driver.",
  "language": "en"
}
```

### Output Example

```json
{
  "service_type": "airport_pickup",
  "arrival_airport": "HND",
  "pickup_date": "2026-05-20",
  "pickup_time": "14:30",
  "dropoff_location": "Shinjuku, Tokyo",
  "passenger_count": 4,
  "luggage_count": 4,
  "preferred_language": "Chinese",
  "vehicle_type": "Alphard/Vellfire",
  "missing_fields": [
    "flight_number",
    "customer_contact"
  ]
}
```

## 5. API: Generate Quote

### Endpoint

```http
POST /api/quote/generate
```

### Purpose

Generate transportation quote based on order information.

### Input Example

```json
{
  "service_type": "airport_pickup",
  "region": "Tokyo",
  "arrival_airport": "HND",
  "dropoff_location": "Shinjuku, Tokyo",
  "pickup_date": "2026-05-20",
  "pickup_time": "14:30",
  "passenger_count": 4,
  "luggage_count": 4,
  "vehicle_type": "Alphard/Vellfire",
  "preferred_language": "Chinese"
}
```

### Output Example

```json
{
  "price_jpy": 18000,
  "price_usd_reference": 115,
  "currency": "JPY",
  "vehicle_type": "Alphard/Vellfire",
  "included": [
    "Driver",
    "Fuel",
    "Vehicle",
    "Highway toll",
    "Parking fee"
  ],
  "excluded": [
    "Extra waiting fee",
    "Signage service",
    "Child seat fee",
    "Additional stop",
    "Route change"
  ],
  "notes": [
    "This is an estimated booking request, not final confirmation. Final price, vehicle availability, and driver arrangement require operator confirmation. If you accept the quote, a 20% deposit is required through PayPal to secure the booking."
  ]
}
```

## 6. API: Create Order

### Endpoint

```http
POST /api/order/create
```

### Purpose

Create a structured JTDOS order.

Important:

The created object is a booking request / estimated quote until operator Liu Xiang confirms final price, vehicle availability, driver arrangement, and 20% PayPal deposit.

### Input Example

```json
{
  "source": "ai_agent",
  "service_type": "airport_pickup",
  "region": "Tokyo",
  "arrival_airport": "HND",
  "dropoff_location": "Shinjuku, Tokyo",
  "pickup_date": "2026-05-20",
  "pickup_time": "14:30",
  "flight_number": "JL000",
  "passenger_count": 4,
  "luggage_count": 4,
  "preferred_language": "Chinese",
  "vehicle_type": "Alphard/Vellfire",
  "customer_name": "Test Customer",
  "customer_whatsapp": "+000000000",
  "price_jpy": 18000,
  "price_usd_reference": 115,
  "deposit_required": true,
  "deposit_rate": 0.2,
  "deposit_amount_jpy": 3600,
  "paypal_payment_required": true,
  "final_confirmation_required_by_operator": "Liu Xiang",
  "primary_contact_channel": "WhatsApp",
  "line_contact": "",
  "special_requests": "Chinese-speaking driver preferred."
}
```

### Output Example

```json
{
  "success": true,
  "order_id": "JTDOS-20260520-0001",
  "order_status": "booking_request_created"
}
```

## 7. API: Send Order to JTDSS

### Endpoint

```http
POST /api/jtdss/send-order
```

### Purpose

Send or synchronize the operator-confirmed JTDOS order to the existing JTDSS backend.

Do not send orders to drivers before operator Liu Xiang confirms final details and deposit.

### Input Example

```json
{
  "order_id": "JTDOS-20260520-0001",
  "jtdss_payload": {
    "service_type": "airport_pickup",
    "airport": "HND",
    "destination": "Shinjuku, Tokyo",
    "pickup_time": "2026-05-20 14:30",
    "passenger_count": 4,
    "luggage_count": 4,
    "vehicle_type": "Alphard/Vellfire",
    "price_jpy": 18000,
    "customer_contact": "+000000000"
  }
}
```

### Output Example

```json
{
  "success": true,
  "jtdss_order_id": "JTDSS-000123",
  "order_status": "sent_to_jtdss"
}
```

## 8. API: Email Notification

### Endpoint

```http
POST /api/notify/email
```

### Purpose

Send order notification to internal operator or customer.

### Input Example

```json
{
  "to": "operator@example.com",
  "subject": "New JTDOS Order: HND to Shinjuku",
  "order_id": "JTDOS-20260520-0001",
  "message": "A new airport pickup order has been generated."
}
```

## 9. API: WhatsApp Notification

### Endpoint

```http
POST /api/notify/whatsapp
```

### Purpose

Send order notification by WhatsApp.

### Important

Alpha 0.1 can use a placeholder or manual integration first.

The production version should connect to WhatsApp Business API or a supported provider.

## 10. API: Telegram Notification

### Endpoint

```http
POST /api/notify/telegram
```

### Purpose

Send order notification to Telegram group or channel.

### Input Example

```json
{
  "chat_id": "",
  "order_id": "JTDOS-20260520-0001",
  "message": "New order: HND to Shinjuku, 4 pax, Alphard/Vellfire, 2026-05-20 14:30."
}
```

## 11. Alpha 0.1 Development Priority

Priority order:

1. Build order schema
2. Build order extraction
3. Build quote generation
4. Build create order API
5. Build operator confirmation flow
6. Build JTDSS connector
7. Add Email notification
8. Add Telegram notification
9. Add WhatsApp notification

## 12. Important Principle

JTDOS is not only a chatbot.

JTDOS must convert AI conversations into executable transportation orders.
