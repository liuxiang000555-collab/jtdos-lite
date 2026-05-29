# JTDOS PRICING RULES

## 1. Purpose

This document defines the pricing rules for JTDOS Alpha 0.1.

The rules in `docs/REAL_BUSINESS_RULES_V1.md` and `docs/REAL_PRICING_AND_CHARTER_RULES_V1.md` override all earlier placeholder pricing rules.

The pricing engine must help the AI Sales Agent generate estimated booking requests for:

- Airport pickup
- Airport drop-off
- Point-to-point transfer
- One-day charter
- Multi-day charter

All internal prices are calculated in JPY.

USD may be displayed as reference only.

## 2. Currency Rule

Primary currency:

- JPY

Reference currency:

- USD

Rules:

- Final settlement is based on JPY.
- USD price is for reference only.
- Exchange rate must be configurable.
- AI should always say "USD is only for reference."

## 2.1 Price Table Source Priority

For Hokkaido quotes, code must read the real JSON price table first:

```text
database/jtdos_hokkaido_price_real_v1.json
```

Codex and operators may read the Markdown version:

```text
database/base_prices_hokkaido_real_v1.md
```

The old placeholder Hokkaido prices must not be used when the real JSON table contains a matching route, vehicle, service type, and period.

## 3. Quote Status and Confirmation

AI-generated quotes are not final confirmations.

AI quote status:

```text
Booking request / estimated quote
```

Final confirmation requires:

```text
Operator confirmation by Liu Xiang
```

Recommended flow:

```text
AI generates quote
-> Customer accepts quote
-> Customer contacts operator
-> Operator confirms details and deposit
-> Operator confirms order
-> Order synchronizes to JTDSS
-> Drivers can accept / dispatch
```

## 4. Pricing Accuracy Level

### 4.1 Fixed Price

Used when:

- Standard airport transfer route exists in the real price table
- Standard point-to-point route exists in the real price table
- No special request or operator-review trigger exists

Status:

```text
fixed_price
```

Important:

`fixed_price` means price does not need manual price confirmation.

It does not mean driver assignment or vehicle availability is confirmed.

### 4.2 Estimated Quote

Used when:

- Customer is asking general price
- Some information is missing
- Driver availability is not confirmed

Status:

```text
estimated
```

### 4.3 Operator Review Quote

Used when:

- Route is complex
- Multi-day itinerary is involved
- Luxury vehicle is requested
- Ski equipment or special luggage exists
- Customer has special requirements

Status:

```text
operator_review_required
```

### 4.4 Confirmed Quote

Use only after operator confirmation by Liu Xiang.

Status:

```text
confirmed
```

## 5. General Pricing Components

A quote may include the following components:

```json
{
  "base_price": 0,
  "vehicle_adjustment": 0,
  "night_surcharge": 0,
  "language_surcharge": 0,
  "waiting_fee": 0,
  "child_seat_fee": 0,
  "ski_equipment_fee": 0,
  "parking_fee": 0,
  "highway_toll": 0,
  "long_distance_fee": 0,
  "seasonal_surcharge": 0,
  "operator_adjustment": 0,
  "total_price_jpy": 0
}
```

## 6. Included and Excluded Items

### 6.1 Standard Transfer Included Items

For standard airport transfer and point-to-point transfer, the price normally includes:

- Driver
- Vehicle
- Fuel
- Highway toll
- Parking fee

### 6.2 Charter Included Items

For charter, the price normally includes:

- Driver
- Vehicle
- Fuel
- Highway toll
- Parking fee
- Driver meal

Standard one-day charter includes 10 hours.

### 6.3 Items Not Included by Default

Unless specifically confirmed, the following are not included:

- Extra waiting fee
- Signage / placard service
- Child seat fee
- Additional stop
- Route change
- Extra hour
- Guide service
- Entrance tickets
- Meals
- Accommodation
- Customer personal expenses

Important:

For standard transfer orders in JTDOS Alpha 0.1, highway toll and parking fee are included by default.

## 7. Waiting Time and No-Show Rules

### 7.1 Airport Pickup Waiting Time

Standard airport pickup free waiting time:

```text
90 minutes after actual flight arrival
```

During peak season, free waiting time is reduced to:

```text
60 minutes after actual flight arrival
```

### 7.2 Hotel / City Pickup Waiting Time

For airport drop-off, hotel pickup, city pickup, and point-to-point transfer:

```text
30 minutes after scheduled pickup time
```

### 7.3 No-Show Rule

If the customer exceeds the free waiting time and cannot be contacted:

```text
The order is treated as no-show, and the driver may leave.
```

If the customer can be contacted after exceeding the free waiting time:

```text
The driver may continue waiting only if the driver agrees.
In principle, the driver has the right to leave after the free waiting time.
```

### 7.4 Extra Waiting Fee

Extra waiting fee:

```text
JPY 3,000 per 30 minutes
```

This rule applies uniformly unless operator manually adjusts.

## 8. Peak Season Definition

### 8.1 Tokyo / Osaka Peak Season

Tokyo and Osaka peak seasons are:

- July
- August
- December 20 – January 5
- 5 days before and after Chinese New Year's Eve

### 8.2 Hokkaido Peak Season

Hokkaido peak seasons are:

- December 20 – December 31
- 5 days before and after Chinese New Year's Eve

## 9. Early Booking Peak Season Protection Rule V2

Night surcharge applies between:

```text
21:00–07:00
```

Do not use the old "peak season night +50%" logic.

Final price logic:

- Non-peak daytime: use `normal_price`, `night_surcharge_rate = 0`.
- Non-peak nighttime: use `normal_price`, `night_surcharge_rate = 0.2`.
- Peak daytime booked 25+ days early: use `normal_price`, `early_booking_protection_applied = true`, `night_surcharge_rate = 0`.
- Peak nighttime booked 25+ days early: use `normal_price`, `early_booking_protection_applied = true`, `night_surcharge_rate = 0.2`.
- Peak daytime booked less than 25 days early: use `peak_price`, `early_booking_protection_applied = false`, `night_surcharge_rate = 0`.
- Peak nighttime booked less than 25 days early: use `peak_price`, `early_booking_protection_applied = false`, `night_surcharge_rate = 0.2`.

Peak season is reflected through `peak_price`.

Night surcharge is always +20% when service time is 21:00–07:00.

Early booking protection only changes the base price from `peak_price` to `normal_price`. It does not waive night surcharge.

If `service_date` cannot be determined, use the lowest available price for the same route and vehicle and set:

```text
quote_confidence = medium
```

If `booking_created_at` is missing, early booking protection must not be applied.

Important:

Earlier placeholder rules used `22:00–07:00`, fixed `JPY 3,000`, or peak night +50%. These are no longer valid.

## 10. Signage / Placard Rule

Airport signage / placard service is optional.

Fee:

```text
JPY 2,000
```

AI should ask whether the customer needs signage only when relevant.

## 11. Child Seat and Special Luggage Rules

### 11.1 Child Seat

Child seat fee:

```text
JPY 1,000 per seat
```

AI must ask:

- Number of children
- Age of children
- Number of child seats required

### 11.2 Baby Stroller

Baby stroller must be counted as luggage.

AI should ask about stroller quantity if children or infants are mentioned.

### 11.3 Ski Equipment

Ski equipment / snowboard bags must be declared in advance.

AI must ask:

- Number of ski bags
- Number of snowboard bags
- Number of large suitcases
- Passenger count

If customer has:

```text
4 passengers + 4 large suitcases + ski/snowboard bags
```

Then:

```text
HiAce is required.
```

Alphard / Vellfire is only suitable for ski equipment in limited cases, such as:

- Up to 3 passengers
- Up to 2 ski/snowboard bags
- Limited luggage

## 12. Vehicle Pricing Logic

### 12.1 Alphard / Vellfire

Recommended maximum:

- Up to 5 passengers
- 4–6 large suitcases depending on luggage size and seating arrangement

Conservative AI recommendation:

- 1–4 passengers with up to 4 large suitcases

AI may mention that 5 passengers or 5–6 suitcases may require confirmation.

### 12.2 HiAce

Recommended maximum:

- Up to 9 passengers
- Up to 8 large suitcases

### 12.3 Luxury Vehicles

Available mainly in Tokyo and Osaka:

- Lexus LM550
- Mercedes-Benz S400
- Mercedes-Benz S500
- Rolls-Royce Ghost

Luxury vehicles can be arranged, but final price and availability require manual operator confirmation.

Recommended status:

```text
operator_review_required = true
quote_confidence = low
```

## 13. Deposit and Cancellation Policy

### 13.1 Deposit Rule

After the AI generates a booking request and the customer accepts the quote:

```text
Customer pays 20% deposit of the total order amount through operator's PayPal.
```

### 13.2 Free Cancellation

Cancellation is free if:

```text
Customer cancels 7 days or more before the service date.
```

The 7th day is included.

### 13.3 Cancellation Within 7 Days

If customer cancels within 7 days:

```text
10% of the total order amount will be charged.
```

The AI should explain cancellation policy clearly, but final policy may still be confirmed by operator.

## 14. Airport Transfer Pricing Logic

Airport transfer price should consider:

- Airport
- Destination area
- Vehicle type
- Date and time
- Peak season
- Night time
- Passenger count
- Luggage count
- Ski/snowboard bags
- Child seat
- Signage / placard request

Example output:

```json
{
  "service_type": "airport_pickup",
  "route": "Haneda Airport to Shinjuku",
  "vehicle_type": "Alphard/Vellfire",
  "price_status": "fixed_price",
  "quote_confidence": "high",
  "price_jpy": 18000,
  "included": ["Driver", "Vehicle", "Fuel", "Highway toll", "Parking fee"],
  "excluded": ["Extra waiting fee", "Signage service", "Child seat fee", "Additional stop", "Route change"],
  "notes": [
    "Fixed price means the route price does not need manual price confirmation. Vehicle availability and driver assignment are still subject to operational acceptance."
  ]
}
```

## 15. Point-to-Point Pricing Logic

Point-to-point transfer price should consider:

- Pickup location
- Drop-off location
- Distance
- Estimated driving time
- Vehicle type
- Luggage
- Region
- Night surcharge
- Peak season

Complex or long-distance point-to-point routes should be marked:

```text
operator_review_required
```

For standard point-to-point routes in the real price table, return one fixed price and do not return a price range.

Transfer stop rule:

- Additional sightseeing stops are not allowed by default.
- Shopping stops are not allowed by default.
- Restaurant stops are not allowed by default.
- Photo stops are not allowed by default.
- A short restroom stop at a convenience store may be allowed for about 10 minutes.

If customer requests shopping, photo, meal, or sightseeing stop on the way, treat the service as charter rather than point-to-point transfer.

## 16. Charter and Multi-Day Charter Pricing Logic

### 16.1 One-Day Charter

Standard one-day charter is:

```text
10 hours
```

Short charter orders below 10 hours require manual review.

Within 4 hours, price may be discounted by up to 40%.

More than 4 hours is generally calculated as one-day charter.

Extra time fee:

```text
JPY 3,000 per 30 minutes
```

If exceeded time is less than 30 minutes:

```text
No extra fee
```

Charter price should consider:

- Region
- Service hours
- Route
- Vehicle type
- Season
- Distance
- Parking
- Highway tolls
- Driver meal/accommodation if needed
- Extra hours

If one-way driving distance exceeds 150 km, mark:

```text
long_distance_charter = true
operator_review_required = true
```

If a one-day charter ends in a different city and the driver returns empty, calculate as 8-hour charter plus 2-hour return logic.

### 16.2 Multi-Day Charter

Multi-day charter can be automatically quoted by the system, but final confirmation requires operator review.

All multi-day charter orders should be marked:

```text
operator_review_required
```

Standard daily service time:

```text
10 hours per day
```

Driver accommodation allowance:

```text
JPY 8,000 per night
```

Multi-day charter extra time fee:

```text
JPY 3,000 per 30 minutes
```

If exceeded time is less than 30 minutes:

```text
No extra fee
```

Deposit is 20% of total order amount.

## 16.3 Language and Guide Service

Default service is Chinese-speaking service when available.

English-speaking driver request requires operator review.

If customer requires English, Spanish, or other-language explanation / guiding service:

- Operator review required
- Guide fee estimate: JPY 20,000–30,000 per day

Chinese simple explanation:

- No additional charge
- Does not automatically require operator review

If Chinese-speaking customer requires the driver to get off the vehicle and accompany them during sightseeing:

```text
JPY 10,000 per day additional fee
```

Driver is mainly responsible for transportation and is not a professional guide unless guide service is separately arranged.

Professional guide or interpretation service requires additional quote.

## 16.4 Operator Review Rules

Requires operator review:

- Luxury vehicle request
- Multi-day charter
- More than 9 passengers
- Multiple vehicles
- Ski equipment or large luggage
- Peak season orders
- Complex route
- English-speaking driver request
- Female driver request
- Airport VIP service
- Private jet pickup or drop-off
- Long-distance charter over 150 km one way
- Short charter under 10 hours
- Other special customer requirements

Does not automatically require operator review:

- Normal airport pickup
- Normal airport drop-off
- Normal point-to-point transfer
- Night transfer order
- Same-day or next-day order
- Chinese driver simple explanation
- Chinese driver-guided simple service within normal conditions

## 17. Quote Confidence Level

Every quote should include confidence level:

```json
{
  "quote_confidence": "low | medium | high"
}
```

High confidence:

- Standard airport transfer
- Route is common
- Price table exists
- No special request

Medium confidence:

- Some information is missing
- Route is known but details need confirmation
- Slight special requirement exists

Low confidence:

- Multi-day charter
- Luxury vehicle
- Complex itinerary
- Ski group
- Long-distance route
- Peak season

## 18. Customer-Facing Disclaimer

AI must include this message when generating quote:

English:

```text
This is an estimated booking request, not final confirmation. Final price, vehicle availability, and driver arrangement require operator confirmation. If you accept the quote, a 20% deposit is required through PayPal to secure the booking.
```

Chinese:

```text
以上为预约请求及预估报价，并非最终确认。最终价格、车辆空位和司机安排需要由工作人员确认。如您接受报价，需要通过 PayPal 支付订单总额20%的定金以保留车辆。
```

Japanese:

```text
上記は予約リクエストおよび概算見積もりであり、最終確定ではありません。最終料金、車両の空き状況、ドライバー手配は担当者による確認が必要です。見積内容に同意される場合、予約確保のためPayPalにて総額の20%のデポジットが必要です。
```

## 19. Alpha 0.1 Principle

Alpha 0.1 does not need perfect automated pricing.

The goal is:

- Give reasonable estimated booking request
- Identify missing information
- Mark complex orders for operator review
- Require operator confirmation before final order synchronization or dispatch
