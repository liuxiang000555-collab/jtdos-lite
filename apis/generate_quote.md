# API DESIGN: GENERATE QUOTE

## 1. Endpoint

```http
POST /api/quote/generate
```

## 2. Purpose

Generate a JTDOS transportation quote based on customer order information.

The API must follow:

- `docs/REAL_BUSINESS_RULES_V1.md`
- `docs/REAL_PRICING_AND_CHARTER_RULES_V1.md`
- Real base price tables
- Vehicle mapping
- Transfer / charter conversion rules
- Operator review rules

## 3. Core Principle

For normal airport transfer and point-to-point orders:

- If the route exists in the real price table, return one fixed price.
- Do not return a price range.
- `price_status = fixed_price`.
- `fixed_price` means the price does not need manual price confirmation.
- `fixed_price` does not mean a driver has accepted the order.
- Vehicle availability and driver assignment still depend on system availability and operational acceptance.

For special orders:

- Use `price_status = estimated` or `price_status = operator_review_required`.
- Use price range only for luxury vehicle, professional guide service, unlisted route, complex route, special VIP request, or operator review cases.

## 4. Input

```json
{
  "service_type": "airport_pickup",
  "region": "Tokyo",
  "pickup_location": "Haneda Airport",
  "dropoff_location": "Shinjuku, Tokyo",
  "pickup_date": "2026-06-01",
  "pickup_time": "14:30",
  "booking_created_at": "2026-05-01",
  "passenger_count": 4,
  "luggage_count": 4,
  "ski_equipment_count": 0,
  "snowboard_bag_count": 0,
  "child_seat_required": false,
  "child_seat_count": 0,
  "preferred_language": "Chinese",
  "vehicle_type": "Alphard/Vellfire",
  "signage_required": false,
  "requested_stops": [],
  "guide_service_required": false,
  "driver_accompanying_required": false,
  "charter_hours_per_day": 0,
  "charter_days": 0,
  "exchange_rate_usd_jpy": 155
}
```

## 5. Standard Transfer Output Example

```json
{
  "success": true,
  "service_type": "airport_pickup",
  "price_status": "fixed_price",
  "quote_confidence": "high",
  "currency": "JPY",
  "price_jpy": 18000,
  "price_usd_reference": 115,
  "deposit_required": true,
  "deposit_rate": 0.2,
  "deposit_amount_jpy": 3600,
  "paypal_payment_required": true,
  "operator_review_required": false,
  "driver_assignment_confirmed": false,
  "breakdown": {
    "base_price_jpy": 18000,
    "normal_price_jpy": 18000,
    "peak_price_jpy": 0,
    "night_surcharge_jpy": 0,
    "signage_jpy": 0,
    "child_seat_jpy": 0,
    "guide_fee_estimate_jpy": 0,
    "driver_accompanying_fee_jpy": 0,
    "driver_accommodation_jpy": 0,
    "operator_adjustment_jpy": 0
  },
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
    "Route change",
    "Extra hour",
    "Guide service",
    "Entrance tickets",
    "Meals",
    "Accommodation",
    "Customer personal expenses"
  ],
  "notes": [
    "Fixed price means the route price does not need manual price confirmation. Vehicle availability and driver assignment are still subject to operational acceptance.",
    "For transfer orders, shopping, photo, restaurant, and sightseeing stops are not included. A short convenience-store restroom stop of about 10 minutes may be allowed.",
    "If you accept the quote, a 20% deposit is required through PayPal to secure the booking."
  ]
}
```

## 6. Region and Price Table Selection

If region is Hokkaido, use:

```text
database/jtdos_hokkaido_price_real_v1.json
```

The human-readable Markdown source for Codex and operators is:

```text
database/base_prices_hokkaido_real_v1.md
```

Hokkaido quote logic must prioritize `database/jtdos_hokkaido_price_real_v1.json` over any older placeholder Hokkaido table.

The old `database/base_prices_hokkaido.md` file is historical reference only and must not be used as the formal quote source.

If region is Tokyo, use:

```text
database/jtdos_tokyo_price_real_v1.json
```

The human-readable Markdown source for Codex and operators is:

```text
database/base_prices_tokyo_real_v1.md
```

Tokyo quote logic must read `database/jtdos_tokyo_price_real_v1.json` directly. Do not read Excel files for Tokyo quotes.

The old `database/base_prices_tokyo.md` file is historical reference only and must not be used as the formal Tokyo quote source.

If region is Osaka or Kansai, use:

```text
database/jtdos_osaka_price_real_v1.json
```

The human-readable Markdown source for Codex and operators is:

```text
database/base_prices_osaka_real_v1.md
```

Osaka quote logic must read `database/jtdos_osaka_price_real_v1.json` directly. Do not read PDF files for Osaka quotes.

The original PDF is only the raw price source. The old `database/base_prices_osaka.md` file is historical reference only and must not be used as the formal Osaka quote source.

Until real operator-provided price tables are fully entered, temporary data may be used only for testing. Production quote logic must use real base prices.

## 6.1 Hokkaido Real Price Table Matching

For Hokkaido, code should read:

```text
database/jtdos_hokkaido_price_real_v1.json
```

Use these JSON fields:

- `records`
- `service_type`
- `vehicle_code`
- `route_en`
- `period`
- `source_price_cny`
- `price_jpy`
- `price_usd_reference`

Customer-facing quote output must show:

- JPY main price
- USD reference price, if needed

Customer-facing quote output must not show:

- CNY / RMB source price

Vehicle mapping:

- Alphard / Vellfire = `alphard_vellfire`
- HiAce = `hiace_10`

Service type mapping:

- Airport pickup / airport drop-off / point-to-point airport transfer = `airport_transfer`
- 10-hour charter = `charter_10h`

Period matching:

- `12.1-12.20`
- `12.21-12.31`
- `1.1-2.10`
- `2.11-2.21`
- `2.22-后`
- `Off-season / non-winter`

If pickup date is outside the winter periods, use the `Off-season / non-winter` row.

If route, vehicle, service type, and period match:

```json
{
  "price_status": "fixed_price",
  "quote_confidence": "high",
  "operator_review_required": false
}
```

If no matching Hokkaido row exists:

```json
{
  "price_status": "operator_review_required",
  "quote_confidence": "low",
  "operator_review_required": true
}
```

## 6.2 Tokyo Real Price Table Matching

For Tokyo, code should read:

```text
database/jtdos_tokyo_price_real_v1.json
```

Use these JSON fields:

- `routes`
- `service_type`
- `route`
- `prices_jpy`
- `included_default`
- `excluded_default`
- `surcharges`
- `tokyo_peak_seasons`

Customer-facing quote output must show:

- JPY main price
- USD reference price only when generated at runtime by configurable exchange rate

Customer-facing quote output must not depend on Excel and must not read Excel.

Vehicle mapping:

- Alphard / Vellfire = `Alphard/Vellfire`
- HiAce = `HiAce`
- Luxury vehicle = `operator_review_required`

Service type mapping:

- Airport pickup / airport drop-off = `airport_transfer`
- Point-to-point transfer = `point_to_point`
- Standard Tokyo charter = `charter_10h`

Location normalization:

- Haneda Airport / 羽田空港 / 羽田机场 = `HND`
- Narita Airport / 成田空港 / 成田机场 = `NRT`
- Tokyo Station / 东京站 / 東京駅 / Shinkansen = `东京23区`
- Shinjuku / Shibuya / Ginza / Roppongi / Ueno / Ikebukuro / Akasaka = `东京23区`
- Maihama / Tokyo Disneyland / Tokyo DisneySea = `舞滨 / 迪士尼`
- Yokohama = `横滨`
- Kawaguchiko / Fuji / Mt. Fuji = `河口湖 / 富士山`
- Hakone = `箱根`
- Kamakura = `镰仓`
- Nikko = `日光`
- Karuizawa = `轻井泽`

If route and vehicle match:

```json
{
  "price_status": "fixed_price",
  "quote_confidence": "high",
  "operator_review_required": false
}
```

If no matching Tokyo row exists:

```json
{
  "price_status": "estimated",
  "quote_confidence": "low",
  "operator_review_required": true
}
```

Tokyo peak season and night calculation must follow Early Booking Peak Season Protection Rule V2:

- Peak season uses `peak_price`.
- If no explicit `peak_price` exists in JSON, calculate `peak_price = normal_price * 1.5`.
- Night surcharge is always +20% between 21:00–07:00.
- Do not use the old peak-night +50% logic.
- If booking is created at least 25 days before service date, use `normal_price`; night surcharge still applies.

## 6.3 Osaka / Kansai Real Price Table Matching

For Osaka / Kansai, code should read:

```text
database/jtdos_osaka_price_real_v1.json
```

Use these JSON fields:

- `routes`
- `route_key`
- `service_type`
- `pickup_location`
- `dropoff_location`
- `bidirectional`
- `prices`
- `included`
- `excluded`
- `price_rules`

The PDF is only the original operator price source and must not be read by quote code.

Vehicle mapping:

- Alphard / Vellfire = `alphard_vellfire`
- HiAce = `hiace`
- 14-seater = `fourteen_seater`, but automatic quote must mark `operator_review_required`
- Luxury vehicle = `operator_review_required`

Service type mapping:

- Airport pickup / airport drop-off = `airport_transfer`
- Point-to-point transfer = `point_to_point`
- Osaka / Kansai service area or charter reference = `charter_10h_or_service_area`

Location normalization:

- Kansai Airport / Kansai International Airport / KIX / 関西空港 / 关西机场 = `Kansai Airport`
- Osaka / Osaka City / Umeda / Namba / Shinsaibashi / Dotonbori = `Osaka City`
- Kyoto = `Kyoto City`
- Nara = `Nara City`
- Kobe = `Kobe City`
- Wakayama = `Wakayama`
- Shirahama = `Shirahama`
- Universal Studios Japan / USJ = `Universal Studios Japan Area`

If route and vehicle match:

```json
{
  "price_status": "fixed_price",
  "quote_confidence": "high",
  "operator_review_required": false
}
```

If no matching Osaka row exists:

```json
{
  "price_status": "estimated",
  "quote_confidence": "low",
  "operator_review_required": true
}
```

Osaka peak season and night calculation must follow Early Booking Peak Season Protection Rule V2:

- Peak season uses `peak_price_jpy` from JSON.
- Night surcharge is always +20% between 21:00–07:00.
- Do not use the old peak-night +50% logic.
- If booking is created at least 25 days before service date, use `normal_price_jpy`; night surcharge still applies.

## 7. Standard Transfer Logic

Standard transfer service types:

- `airport_pickup`
- `airport_dropoff`
- `point_to_point`

If route exists in the real price table and no operator-review trigger exists:

```json
{
  "price_status": "fixed_price",
  "operator_review_required": false,
  "quote_confidence": "high"
}
```

Included must be:

- Driver
- Vehicle
- Fuel
- Highway toll
- Parking fee

Excluded must not include toll or parking.

Do not automatically add special parking fee or airport fee for standard transfer orders.

## 8. Transfer Stop Rule

For airport transfer and point-to-point transfer:

- Additional sightseeing stops are not allowed by default.
- Shopping stops are not allowed by default.
- Restaurant stops are not allowed by default.
- Photo stops are not allowed by default.

Exception:

- A short restroom stop at a convenience store may be allowed for about 10 minutes.

If customer requests shopping, taking photos, eating, or visiting a sightseeing spot on the way:

```json
{
  "service_type": "charter",
  "converted_from_transfer": true,
  "operator_review_required": true
}
```

AI should say:

```text
This would be considered a charter service rather than a point-to-point transfer.
```

Chinese:

```text
这种情况属于包车服务，不属于普通点对点接送。
```

## 9. Early Booking Peak Season Protection Rule V2

Pricing must follow this order:

1. Check whether `service_date` is in peak season.
2. Check whether `booking_created_at` is at least 25 days before `service_date`.
3. Check whether `service_time` is night time between 21:00–07:00.

Do not use the old "peak season night +50%" logic.

Peak season is reflected through `peak_price`.

Night surcharge is always:

```text
0.2
```

Night time:

```text
21:00–07:00
```

Final price cases:

| Case | Base Price | early_booking_protection_applied | night_surcharge_rate | Final Price |
| --- | --- | --- | ---: | --- |
| Non-peak daytime | normal_price | false | 0 | normal_price |
| Non-peak nighttime | normal_price | false | 0.2 | normal_price * 1.2 |
| Peak daytime, booked 25+ days early | normal_price | true | 0 | normal_price |
| Peak nighttime, booked 25+ days early | normal_price | true | 0.2 | normal_price * 1.2 |
| Peak daytime, booked less than 25 days early | peak_price | false | 0 | peak_price |
| Peak nighttime, booked less than 25 days early | peak_price | false | 0.2 | peak_price * 1.2 |

Quote output should include:

```json
{
  "early_booking_protection_applied": true,
  "applied_base_price_type": "normal_price",
  "night_surcharge_rate": 0.2
}
```

If `service_date` cannot be determined:

```json
{
  "applied_base_price_type": "normal_price",
  "quote_confidence": "medium"
}
```

Use the lowest available price for the same route and vehicle.

If `booking_created_at` is missing, early booking protection must not be applied.

Night transfer orders do not automatically require operator review if the route is in the real price table and no special request exists.

## 10. Waiting, Signage, and Child Seat Fees

Extra waiting fee:

```text
JPY 3,000 per 30 minutes
```

Signage / placard service:

```text
JPY 2,000
```

Child seat:

```text
JPY 1,000 per seat
```

Airport pickup free waiting time:

- Non-peak: 90 minutes after actual flight arrival
- Peak: 60 minutes after actual flight arrival

Hotel / city pickup free waiting time:

- 30 minutes after scheduled pickup time

## 11. Charter Logic

Standard one-day charter:

```text
10 hours
```

Short charter:

- 4 hours
- 5 hours
- 6 hours
- 8 hours

Rules:

- Orders below 10 hours require manual review.
- Within 4 hours, price may be discounted by up to 40%.
- More than 4 hours is generally calculated as one-day charter.

Recommended output for short charter:

```json
{
  "charter_hours_per_day": 10,
  "short_charter_operator_review_required": true,
  "within_4_hours_discount_max": 0.4,
  "over_4_hours_price_rule": "one_day_charter_price",
  "operator_review_required": true
}
```

Charter extra time fee:

```text
JPY 3,000 per 30 minutes
```

If exceeded time is less than 30 minutes:

```text
No extra fee
```

Charter included items:

- Driver
- Vehicle
- Fuel
- Highway toll
- Parking fee
- Driver meal

## 12. Long-Distance and One-Way Charter Logic

If one-way driving distance exceeds 150 km:

```json
{
  "long_distance_charter": true,
  "operator_review_required": true
}
```

Examples:

- Tokyo -> Karuizawa
- Tokyo -> Nikko
- Tokyo -> Nagano ski resort

One-way charter ending in a different city:

Example:

- Tokyo -> Hakone and customer stays overnight in Hakone

If this is a one-day charter:

- Calculate as 8-hour charter
- Driver empty return time is estimated as 2 hours

If this is continuous multi-day charter:

- Customer must pay driver accommodation allowance
- Driver accommodation allowance: JPY 8,000 per night

## 13. Multi-Day Charter Logic

Multi-day charter can be automatically quoted by the system.

However:

```json
{
  "price_status": "estimated",
  "operator_review_required": true,
  "final_confirmation_required": true
}
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

Deposit:

```text
20% of total order amount
```

## 14. Language and Guide Logic

Default service:

```text
Chinese-speaking service when available
```

English-speaking driver request:

```json
{
  "operator_review_required": true,
  "language_request": "English"
}
```

If customer requires English, Spanish, or other-language explanation / guiding service:

```json
{
  "operator_review_required": true,
  "guide_fee_estimate_jpy": {
    "min": 20000,
    "max": 30000,
    "unit": "per_day"
  }
}
```

Chinese simple explanation:

- No additional charge.
- Does not automatically require operator review.

Chinese driver accompanying outside the vehicle:

```text
JPY 10,000 per day
```

Important:

- Driver is mainly responsible for transportation.
- Driver is not a professional tour guide unless guide service is separately arranged.
- Professional guide or interpretation service requires additional quote.

## 15. Operator Review Logic

Set `operator_review_required = true` for:

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

Do not automatically require operator review for:

- Normal airport pickup
- Normal airport drop-off
- Normal point-to-point transfer
- Night transfer order
- Same-day or next-day order
- Chinese driver simple explanation
- Chinese driver-guided simple service within normal conditions

## 16. Deposit and Cancellation

Deposit:

```text
20% of total order amount
```

Cancellation:

- Free cancellation 7 days or more before service date. The 7th day is included.
- Cancellation within 7 days: 10% of total order amount will be charged.

## 17. Important Principle

The quote API must support:

1. Fixed-price standard transfer orders
2. Operator-review orders
3. Charter and multi-day charter calculation
4. Included toll and parking rule
5. No additional stops for transfer orders
6. Charter conversion when customer requests shopping, sightseeing, or meal stop
7. Driver accommodation fee for multi-day charter
8. Driver accompanying fee
9. Guide fee estimate
10. Fixed price display for normal transfer
11. Price range only for special cases
