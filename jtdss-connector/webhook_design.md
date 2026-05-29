# JTDOS TO JTDSS WEBHOOK DESIGN

## 1. Purpose

This document defines how JTDOS sends AI-generated transportation orders into the existing JTDSS backend.

The goal is to complete the Alpha 0.1 booking request loop:

Customer inquiry  
-> AI quote  
-> Booking request  
-> Operator Liu Xiang confirms final price, vehicle availability, driver arrangement, and deposit  
-> Order synchronizes to JTDSS  
-> Operator / driver can view the confirmed order

## 2. Webhook Direction

JTDOS sends booking request data to JTDSS after operator confirmation, or stores it as pending operator review when confirmation is still required.

```text
JTDOS AI Agent
-> JTDOS Order API
-> Operator Liu Xiang confirmation
-> JTDSS Webhook Endpoint
-> JTDSS Order Database
-> JTDSS Operator / Driver Interface
```

## 3. Proposed Endpoint

JTDSS should provide an endpoint like:

```http
POST /api/external/jtdos/orders
```

Alternative endpoint:

```http
POST /api/webhooks/jtdos/create-order
```

## 4. Authentication

Alpha 0.1 should use API key authentication.

Example header:

```http
Authorization: Bearer JTDOS_API_KEY
Content-Type: application/json
```

Recommended additional headers:

```http
X-JTDOS-Source: ai_agent
X-JTDOS-Request-Id: JTDOS-20260601-0001
```

## 5. Request Payload

JTDOS sends the payload defined in:

```text
jtdss-connector/create_order_payload.json
```

Minimum required fields for JTDSS:

```json
{
  "jtdos_order_id": "JTDOS-20260601-0001",
  "source": "jtdos_ai_agent",
  "service_type": "airport_pickup",
  "region": "Tokyo",
  "status": "quote_generated",
  "driver_assignment_confirmed": false,
  "route": {
    "pickup_location": "Haneda Airport",
    "dropoff_location": "Shinjuku, Tokyo",
    "flight_number": "JL000",
    "pickup_date": "2026-06-01",
    "pickup_time": "14:30"
  },
  "customer": {
    "name": "Test Customer",
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
    "price_status": "fixed_price",
    "deposit_required": true,
    "deposit_rate": 0.2,
    "deposit_amount_jpy": 3600,
    "paypal_payment_required": true,
    "final_confirmation_required_by_operator": "Liu Xiang"
  }
}
```

Important:

`price_status = fixed_price` means the route price does not need manual price confirmation. It does not mean driver assignment is confirmed.

## 6. JTDSS Response

If order is successfully created:

```json
{
  "success": true,
  "jtdss_order_id": "JTDSS-000123",
  "jtdos_order_id": "JTDOS-20260601-0001",
  "status": "received",
  "message": "Order received by JTDSS."
}
```

If request fails:

```json
{
  "success": false,
  "error_code": "INVALID_PAYLOAD",
  "message": "Missing required field: pickup_date"
}
```

## 7. Order Status Mapping

| JTDOS Status | JTDSS Status |
| --- | --- |
| draft | draft |
| quote_generated | pending_operator_review |
| booking_request_created | pending_operator_review |
| customer_accepted_quote | pending_operator_confirmation |
| operator_confirmed | pending_dispatch |
| sent_to_jtdss | received |
| driver_pending | dispatching |
| driver_accepted | driver_confirmed |
| driver_rejected | driver_rejected |
| completed | completed |
| cancelled | cancelled |

## 8. Operator Review Rule

If the order has:

```json
{
  "operator_review_required": true
}
```

JTDSS should show the order as:

```text
pending_operator_review
```

The operator must confirm:

- Final price
- Vehicle availability
- Driver availability
- Route feasibility
- Special requests
- 20% PayPal deposit status

Fixed-price standard transfer orders may skip manual price confirmation, but still require vehicle availability, payment/deposit, and operational acceptance before dispatch.

## 9. Driver Dispatch Rule

Alpha 0.1 does not need fully automatic driver matching.

Drivers should not receive the order for formal dispatch until operator Liu Xiang confirms the order.

Initial dispatch options:

- Operator manually assigns driver
- JTDSS sends order to available driver list
- Driver accepts or rejects order

Automatic driver matching can be added later.

## 10. Notification Flow

After JTDSS receives an order, it should trigger:

- Internal operator notification
- Email backup notification
- Telegram group notification
- WhatsApp message if integration is available

## 11. Duplicate Order Prevention

JTDSS should reject duplicate jtdos_order_id.

If duplicate is detected:

```json
{
  "success": false,
  "error_code": "DUPLICATE_ORDER",
  "message": "This JTDOS order already exists."
}
```

## 12. Security Notes

The webhook must:

- Require API key
- Validate required fields
- Reject duplicate order IDs
- Log every request
- Avoid exposing customer contact data publicly
- Store customer data securely

## 13. Alpha 0.1 Principle

Do not overbuild.

The first goal is only:

AI-generated booking request  
-> Operator Liu Xiang confirms final details and deposit  
-> Send or synchronize confirmed order to JTDSS  
-> JTDSS displays the order  
-> Operator can manually dispatch
