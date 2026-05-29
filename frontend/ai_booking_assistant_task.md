# AI Booking Assistant Frontend Task

## 1. Goal

Implement the JTDOS Alpha 0.1 AI Booking Assistant page.

Route:

```text
/ai-booking
```

## 2. Required UI

The page must include:

- Chat window
- User input box
- Order summary panel
- Quote card
- `Create Booking Request` button
- Test input button: `Test Haneda to Shinjuku`

## 3. Frontend Flow

1. User enters a message.
2. Frontend calls:

```http
POST /api/agent/extract-order
```

3. Show order draft and missing fields.
4. If enough information exists, call:

```http
POST /api/quote/generate
```

5. Show quote card.
6. User clicks:

```text
Create Booking Request
```

7. Frontend calls:

```http
POST /api/order/create
```

8. Then call:

```http
POST /api/jtdss/send-order
```

9. Show success message.

## 4. Missing Field Behavior

If missing fields exist:

- AI should ask no more than 3 missing questions.
- Do not create final order.
- Keep extracted values visible in the order summary panel.

## 5. Price Display Rules

All prices must display:

- JPY main price
- USD reference, if available
- Estimated quote disclaimer

Disclaimer:

```text
Estimated quote only. Final confirmation is subject to operator review and vehicle availability.
```

Chinese:

```text
以上为预估报价，最终价格和车辆空位需由工作人员确认。
```

Japanese:

```text
上記は概算見積もりです。最終料金および車両の空き状況は担当者による確認が必要です。
```

## 6. Required Contact Fields Before Booking

Before creating a booking request, require:

- `customer_name`
- `email` or `whatsapp`, at least one
- `preferred_language`

## 7. Test Input Button

Button label:

```text
Test Haneda to Shinjuku
```

When clicked, fill the input with:

```text
We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.
```

## 8. Basic Tests

Write tests to confirm:

- Can extract order.
- Can display missing fields.
- Can generate quote.
- Can create order.
- Does not create final order when required fields are missing.
- Requires customer name and email or WhatsApp before booking request.

## 9. Alpha 0.1 Boundary

Keep UI simple.

The goal is to prove:

Customer chat  
-> Order extraction  
-> Quote generation  
-> Booking request  
-> JTDSS order creation
