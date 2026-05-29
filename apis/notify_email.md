# API DESIGN: NOTIFY EMAIL

## 1. Endpoint

```http
POST /api/notify/email
```

## 2. Purpose

Send email notification when a JTDOS order is created or received by JTDSS.

## 3. Input

```json
{
  "event_type": "new_order_received",
  "to": "operator@example.com",
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

## 4. Output

```json
{
  "success": true,
  "message": "Email notification sent."
}
```

## 5. Email Subject

```text
New JTDOS Order: {{service_type}} - {{pickup_location}} to {{dropoff_location}}
```

## 6. Email Body Template

```text
New JTDOS Order Received

JTDOS Order ID: {{jtdos_order_id}}
JTDSS Order ID: {{jtdss_order_id}}

Service Type: {{service_type}}
Region: {{region}}
Route: {{pickup_location}} → {{dropoff_location}}
Date/Time: {{pickup_date}} {{pickup_time}}

Passenger Count: {{passenger_count}}
Luggage Count: {{luggage_count}}
Vehicle Type: {{vehicle_type}}

Price: ¥{{price_jpy}}

Customer Name: {{customer_name}}
Customer Contact: {{customer_contact}}

Operator Review Required: {{operator_review_required}}

Open in JTDSS:
{{jtdss_order_url}}
```

## 7. Alpha 0.1 Rule

Use simple email sending first.

Recommended options:

- Resend
- SendGrid
- SMTP
- AWS SES

The provider should be configurable by environment variables.
