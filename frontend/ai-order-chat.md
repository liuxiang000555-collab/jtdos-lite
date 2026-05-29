# JTDOS AI ORDER CHAT FRONTEND DESIGN

## 1. Purpose

This document defines the first customer-facing AI chat interface for JTDOS Alpha 0.1.

The goal is to let customers enter transportation requests and allow the AI Sales Agent to extract order information, generate quote, and create a booking request.

## 2. Alpha 0.1 Frontend Goal

The frontend should support this flow:

Customer message  
-> AI extracts order draft  
-> AI asks missing questions  
-> AI generates quote  
-> Customer accepts quote  
-> AI creates booking request  
-> Operator confirms final details and deposit  
-> Order is sent or synchronized to JTDSS

## 3. Page Name

Recommended page:

```text
AI Booking Assistant
```

Japanese:

```text
AI予約アシスタント
```

Chinese:

```text
AI包车预约助手
```

## 4. URL

Recommended URL:

```text
/ai-booking
```

Alternative:

```text
/jtdos-agent
```

## 5. Main UI Components

### 5.1 Chat Window

Shows conversation between customer and AI.

### 5.2 Order Summary Panel

Displays extracted order information in real time:

- Service type
- Region
- Pickup location
- Drop-off location
- Date
- Time
- Flight number
- Passenger count
- Luggage count
- Vehicle type
- Price
- Missing fields

### 5.3 Quote Card

Displays generated quote:

- Recommended vehicle
- Estimated price JPY
- USD reference price
- Included items
- Excluded items
- Notes
- Quote confidence

### 5.4 Booking Confirmation Button

Button text:

```text
Create Booking Request
```

Chinese:

```text
生成预约订单
```

Japanese:

```text
予約リクエストを作成
```

### 5.5 Contact Fields

Before final order creation, ask for:

- Name
- Email or WhatsApp
- Country
- Preferred contact method

## 6. Suggested User Flow

### Step 1: Customer Opens Chat

AI greeting:

Hello, I can help arrange private airport transfers, point-to-point transfers, and charter services in Japan. Please tell me your route, date, number of passengers, and luggage.

Chinese:

您好，我可以帮您安排日本接送机、点对点用车和包车服务。请告诉我您的路线、日期、人数和行李数量。

Japanese:

こんにちは。日本国内の空港送迎、地点間送迎、貸切チャーターの手配をサポートします。ルート、日付、人数、荷物数を教えてください。

### Step 2: Customer Sends Request

Example:

We are 4 people arriving at Haneda and going to Shinjuku with 4 suitcases.

### Step 3: AI Extracts Order Draft

Frontend calls:

```http
POST /api/agent/extract-order
```

### Step 4: AI Shows Missing Questions

Example:

Sure. May I confirm your arrival date, arrival time, and flight number?

### Step 5: AI Generates Quote

Frontend calls:

```http
POST /api/quote/generate
```

### Step 6: Customer Confirms

Customer clicks:

```text
Create Booking Request
```

### Step 7: Order Created

Frontend calls:

```http
POST /api/order/create
```

Then:

```http
POST /api/jtdss/send-order
```

### Step 8: Success Message

AI says:

Your booking request has been created. Our operator will confirm vehicle availability and final details shortly.

Chinese:

您的预约请求已生成。我们的工作人员会尽快确认车辆空位和最终细节。

Japanese:

予約リクエストが作成されました。車両の空き状況と最終詳細を担当者が確認いたします。

## 7. Order Summary Panel Example

```json
{
  "service_type": "airport_pickup",
  "region": "Tokyo",
  "arrival_airport": "HND",
  "dropoff_location": "Shinjuku, Tokyo",
  "pickup_date": "2026-06-01",
  "pickup_time": "14:30",
  "flight_number": "JL000",
  "passenger_count": 4,
  "luggage_count": 4,
  "preferred_language": "Chinese",
  "vehicle_type": "Alphard/Vellfire",
  "price_jpy": 18000,
  "missing_fields": []
}
```

## 8. Quote Card Example

```json
{
  "vehicle_type": "Alphard/Vellfire",
  "price_jpy": 18000,
  "price_usd_reference": 115,
  "price_status": "estimated",
  "quote_confidence": "high",
  "included": [
    "Driver",
    "Vehicle",
    "Fuel",
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
    "Final price depends on vehicle availability and exact details."
  ]
}
```

## 9. Frontend Safety Rules

The frontend must clearly show:

This is an estimated booking request, not final confirmation. Final price, vehicle availability, and driver arrangement require operator confirmation. If you accept the quote, a 20% deposit is required through PayPal to secure the booking.

Chinese:

以上为预约请求及预估报价，并非最终确认。最终价格、车辆空位和司机安排需要由工作人员确认。如您接受报价，需要通过 PayPal 支付订单总额20%的定金以保留车辆。

Japanese:

上記は予約リクエストおよび概算見積もりであり、最終確定ではありません。最終料金、車両の空き状況、ドライバー手配は担当者による確認が必要です。見積内容に同意される場合、予約確保のためPayPalにて総額の20%のデポジットが必要です。

## 10. Alpha 0.1 Principle

The first frontend does not need to be beautiful.

It must prove:

Customer chat  
-> Order extraction  
-> Quote generation  
-> Booking request  
-> Operator confirmation  
-> JTDSS order creation
