# JTDSS External JTDOS Order API Task

## 1. Goal

Create an external order receiving endpoint in the existing JTDSS backend.

Endpoint:

```http
POST /api/external/jtdos/orders
```

The endpoint receives JTDOS AI-generated booking requests and creates visible orders in the JTDSS operator backend.

AI-generated booking requests are not final confirmations. Operator Liu Xiang must confirm final price, vehicle availability, driver arrangement, and deposit before formal dispatch.

## 2. References

Use these files as the source of truth:

- `jtdss-connector/create_order_payload.json`
- `jtdss-connector/webhook_design.md`

## 3. Requirements

1. Use Bearer API Key authentication.
2. Receive the JTDOS order payload.
3. Validate minimum required fields:
   - `jtdos_order_id`
   - `service_type`
   - `region`
   - `route.pickup_location`
   - `route.dropoff_location`
   - `route.pickup_date`
   - `route.pickup_time`
   - `passenger.passenger_count`
   - `vehicle.vehicle_type`
   - `pricing.price_jpy`
4. Prevent duplicate orders by `jtdos_order_id`.
5. On success, write the order into the existing JTDSS order database.
6. Return `jtdss_order_id`.
7. If `metadata.operator_review_required = true`, set JTDSS order status to `pending_operator_review`.
8. If `metadata.operator_review_required = false`, set JTDSS order status to `pending_operator_confirmation`.
9. Only after operator Liu Xiang confirms the order should status move to `pending_dispatch`.
10. Do not implement automatic dispatch in Alpha 0.1.
11. Ensure the order is visible in the JTDSS backend for manual operator confirmation.
12. Add automated tests.

## 4. Authentication

Request must include:

```http
Authorization: Bearer JTDOS_API_KEY
Content-Type: application/json
```

Recommended headers:

```http
X-JTDOS-Source: ai_agent
X-JTDOS-Request-Id: JTDOS-20260601-0001
```

If API key is missing or invalid, return:

```json
{
  "success": false,
  "error_code": "UNAUTHORIZED",
  "message": "Invalid or missing API key."
}
```

## 5. Success Response

```json
{
  "success": true,
  "jtdss_order_id": "JTDSS-000123",
  "jtdos_order_id": "JTDOS-20260601-0001",
  "status": "pending_operator_confirmation",
  "message": "Order received by JTDSS."
}
```

## 6. Error Responses

Invalid payload:

```json
{
  "success": false,
  "error_code": "INVALID_PAYLOAD",
  "message": "Missing required field: route.pickup_date"
}
```

Duplicate order:

```json
{
  "success": false,
  "error_code": "DUPLICATE_ORDER",
  "message": "This JTDOS order already exists."
}
```

## 7. Suggested Implementation Steps

1. Add route/controller for `POST /api/external/jtdos/orders`.
2. Add API key middleware or reuse existing authentication middleware.
3. Add payload validation.
4. Add duplicate check by `jtdos_order_id`.
5. Map JTDOS payload fields into the existing JTDSS order model.
6. Derive JTDSS order status from `metadata.operator_review_required`.
7. Persist the order.
8. Return `jtdss_order_id`.
9. Log webhook request and result.
10. Add tests for authentication, validation, duplicate prevention, status mapping, and successful creation.

## 8. Required Tests

Test cases:

- Rejects request without Bearer API key.
- Rejects request with invalid API key.
- Rejects request missing `jtdos_order_id`.
- Rejects request missing nested route fields.
- Rejects duplicate `jtdos_order_id`.
- Creates order with `pending_operator_review` when `metadata.operator_review_required = true`.
- Creates booking request with `pending_operator_confirmation` when `metadata.operator_review_required = false`.
- Returns `jtdss_order_id` on success.

## 9. Alpha 0.1 Boundary

Do not build automatic driver matching yet.

Do not send the order to drivers before operator Liu Xiang confirms it.

The first version only needs:

JTDOS structured order  
-> JTDSS receives order  
-> JTDSS stores order  
-> Operator can view order  
-> Operator confirms final details and deposit  
-> Operator manually dispatches order
