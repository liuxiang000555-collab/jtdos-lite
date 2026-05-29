# JTDOS / JTDSS NOTIFICATION DESIGN

## 1. Purpose

This document defines how JTDSS sends notifications after receiving a JTDOS order.

The Alpha 0.1 goal is:

JTDOS order received by JTDSS  
-> Operator receives notification  
-> Order is visible in backend  
-> Operator Liu Xiang confirms final price, vehicle availability, driver arrangement, and deposit  
-> Operator can dispatch manually

## 2. Notification Channels

Alpha 0.1 supports:

1. Email
2. Telegram
3. WhatsApp placeholder

Priority:

1. Email backup notification
2. Telegram internal operation group notification
3. WhatsApp manual link or placeholder

## 3. Trigger Events

Notifications should be triggered when:

- New JTDOS order is received
- Order requires operator review
- Order is ready for dispatch
- Driver accepts order
- Driver rejects order
- Order is cancelled

Alpha 0.1 only needs:

- New JTDOS order received
- Operator review required

## 4. Email Notification

Email should be sent to internal operator email.

Recommended subject:

```text
New JTDOS Order: {{service_type}} - {{pickup_location}} to {{dropoff_location}}
```

Email body should include:

- JTDOS Order ID
- JTDSS Order ID
- Service type
- Region
- Pickup location
- Drop-off location
- Date and time
- Passenger count
- Luggage count
- Vehicle type
- Price
- Customer contact
- Operator review status
- Special requests
- Link to JTDSS order detail page

## 5. Telegram Notification

Telegram should be sent to internal operation group.

Recommended message format:

```text
🚐 New JTDOS Order

Order: {{jtdos_order_id}}
Service: {{service_type}}
Region: {{region}}
Route: {{pickup_location}} → {{dropoff_location}}
Date/Time: {{pickup_date}} {{pickup_time}}
Pax/Luggage: {{passenger_count}} / {{luggage_count}}
Vehicle: {{vehicle_type}}
Price: ¥{{price_jpy}}
Status: {{status}}

Customer: {{customer_name}}
Contact: {{customer_contact}}

Review Required: {{operator_review_required}}

Open in JTDSS:
{{jtdss_order_url}}
```

## 6. WhatsApp Placeholder

Alpha 0.1 does not need full WhatsApp Business API integration.

Instead, generate a manual WhatsApp message link if customer WhatsApp exists.

Example:

```text
https://wa.me/{{customer_whatsapp}}?text={{encoded_message}}
```

The operator can click the link and manually send confirmation.

Production version may use:

- WhatsApp Business API
- Twilio
- 360dialog
- WATI
- Other approved provider

## 7. Operator Review Notification

If:

```json
{
  "operator_review_required": true
}
```

Add warning:

```text
⚠️ Operator review required before dispatch.
```

Reasons may include:

- Multi-day charter
- Luxury vehicle
- Complex route
- Additional stops
- Ski equipment
- More than 9 passengers
- Route not in price table

## 8. Alpha 0.1 Principle

Do not overbuild notification automation.

The first goal is:

New order enters JTDSS  
-> Operator sees it immediately  
-> Operator Liu Xiang can manually review and confirm  
-> Operator can manually dispatch after confirmation
