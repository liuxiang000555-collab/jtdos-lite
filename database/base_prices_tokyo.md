# JTDOS BASE PRICES - TOKYO

> Historical reference only.
>
> Formal Tokyo quote logic must use `database/jtdos_tokyo_price_real_v1.json`.
> The human-readable real Tokyo price table is `database/base_prices_tokyo_real_v1.md`.

## 1. Purpose

This document defines the first Tokyo area base price table for JTDOS Alpha 0.1.

The table supports estimated quotes for:

- Airport pickup
- Airport drop-off
- Point-to-point transfer
- Tokyo surrounding area transfer
- Tokyo one-day charter reference

All internal prices are based on JPY.

USD may be displayed as reference only.

## 2. Pricing Scope

This Alpha 0.1 price table supports:

- Haneda Airport transfer
- Narita Airport transfer
- Tokyo city transfer
- Tokyo to surrounding destinations
- Surrounding destinations to Tokyo

This table is used for estimated quote generation only.

Final price may require operator confirmation.

## 3. Vehicle Types

Supported vehicle classes:

### Alphard / Vellfire

Recommended for:

- 1-4 passengers
- 1-4 large suitcases
- Family travelers
- Business travelers
- Premium airport transfers

### HiAce

Recommended for:

- 5-9 passengers
- Large luggage groups
- Family groups
- Small tour groups

### Luxury Vehicles

Available mainly in Tokyo:

- Lexus LM550
- Mercedes-Benz S400
- Mercedes-Benz S500
- Rolls-Royce Ghost

Luxury vehicle requests must be marked as:

```text
operator_review_required
```

AI must not guarantee availability.

## 4. Haneda Airport Transfer Base Price Table

| Route | Alphard / Vellfire JPY | HiAce JPY |
| --- | ---: | ---: |
| HND ↔ Tokyo 23 Wards | 18,000 | 25,000 |
| HND ↔ Tokyo Station / Shinkansen | 18,000 | 25,000 |
| HND ↔ Yokohama | 23,000 | 32,000 |
| HND ↔ Maihama / Disney Area | 22,000 | 30,000 |
| HND ↔ Tokyo Disneyland / DisneySea | 22,000 | 30,000 |
| HND ↔ Kawaguchiko / Fuji Area | 65,000 | 85,000 |
| HND ↔ Hakone | 68,000 | 88,000 |

## 5. Narita Airport Transfer Base Price Table

| Route | Alphard / Vellfire JPY | HiAce JPY |
| --- | ---: | ---: |
| NRT ↔ Tokyo 23 Wards | 32,000 | 42,000 |
| NRT ↔ Tokyo Station / Shinkansen | 32,000 | 42,000 |
| NRT ↔ Yokohama | 42,000 | 55,000 |
| NRT ↔ Maihama / Disney Area | 28,000 | 38,000 |
| NRT ↔ Tokyo Disneyland / DisneySea | 28,000 | 38,000 |
| NRT ↔ Kawaguchiko / Fuji Area | 78,000 | 98,000 |
| NRT ↔ Hakone | 82,000 | 105,000 |

## 6. Tokyo Surrounding Point-to-Point Reference Table

| Route | Alphard / Vellfire JPY | HiAce JPY |
| --- | ---: | ---: |
| Tokyo 23 Wards ↔ Yokohama | 25,000 | 35,000 |
| Tokyo 23 Wards ↔ Tokyo Disneyland / DisneySea | 25,000 | 35,000 |
| Tokyo Station / Shinkansen ↔ Tokyo Disneyland / DisneySea | 25,000 | 35,000 |
| Tokyo 23 Wards ↔ Kamakura | 42,000 | 55,000 |
| Tokyo 23 Wards ↔ Kawaguchiko / Fuji Area | 65,000 | 85,000 |
| Tokyo 23 Wards ↔ Hakone | 68,000 | 88,000 |
| Tokyo 23 Wards ↔ Nikko | 75,000 | 95,000 |

## 7. Tokyo Charter Reference Price

Standard one-day charter is 10 hours.

Charter orders below 10 hours require manual review. Within 4 hours, price may be discounted by up to 40%; more than 4 hours is generally calculated as one-day charter.

| Charter Type | Alphard / Vellfire JPY | HiAce JPY |
| --- | ---: | ---: |
| Tokyo 6-hour charter | 55,000 | 75,000 |
| Tokyo 8-hour charter | 70,000 | 90,000 |
| Tokyo 10-hour charter | 85,000 | 110,000 |
| Tokyo -> Fuji / Hakone 10-hour charter | 85,000 | 110,000 |
| Tokyo -> Nikko 10-hour charter | 90,000 | 120,000 |

## 8. Luxury Vehicle Pricing Rule

Luxury vehicles are not automatically priced in Alpha 0.1.

Supported luxury vehicle types:

- Lexus LM550
- Mercedes-Benz S400
- Mercedes-Benz S500
- Rolls-Royce Ghost

If customer requests luxury vehicle:

```text
price_status = operator_review_required
quote_confidence = low
```

AI should say:

Luxury vehicle availability and final price require operator confirmation.

Chinese:

高级商务车或豪华车需要人工确认车辆空位和最终价格。

Japanese:

高級車両の空き状況および最終料金は、オペレーターによる確認が必要です。

## 9. Waiting Time Rule

### Airport Arrival Pickup

Free waiting time:

90 minutes after actual flight arrival

During peak season:

60 minutes after actual flight arrival

After free waiting time:

JPY 3,000 per 30 minutes

### Hotel / City Pickup

Free waiting time:

30 minutes after scheduled pickup time

After free waiting time:

JPY 3,000 per 30 minutes

## 10. Night Surcharge Rule

Night surcharge applies when service time falls between:

21:00-07:00

Airport pickup / drop-off night surcharge:

- Night time is always base price +20%
- Peak season is reflected through peak_price
- Booking at least 25 days before service date can use normal_price instead of peak_price
- Early booking protection does not waive night surcharge

## 11. Signage / Placard Rule

Airport signage / placard service:

JPY 2,000

AI should ask whether the customer needs signage service for airport pickup.

## 12. Child Seat Rule

Child seat fee:

JPY 1,000 per seat

AI must ask:

- Number of children
- Age of children
- Whether child seat is required

## 13. Toll and Parking Rule

For standard transfer orders, highway toll and parking fee are included by default.

For long-distance routes such as:

- Fuji
- Hakone
- Nikko
- Kamakura

Extra waiting fee, signage, child seat, additional stop, route change, extra hour, guide service, entrance tickets, meals, accommodation, and customer personal expenses are not included unless specifically confirmed.

## 14. Tokyo Product Notes

### 14.1 Disney Transfer

Disney transfer includes pickup or drop-off at:

- Tokyo Disneyland
- Tokyo DisneySea
- Maihama Station
- Disney Ambassador Hotel
- Tokyo Disney Resort Toy Story Hotel
- Tokyo Disneyland Hotel
- Tokyo DisneySea Fantasy Springs Hotel
- Hotel MiraCosta

For Alpha 0.1, Disney transfer should map to:

```text
Maihama / Disney Area
```

Airport Disney routes:

- HND ↔ Tokyo Disneyland / DisneySea
- NRT ↔ Tokyo Disneyland / DisneySea

City Disney routes:

- Tokyo 23 Wards ↔ Tokyo Disneyland / DisneySea
- Tokyo Station / Shinkansen ↔ Tokyo Disneyland / DisneySea

### 14.2 Tokyo Station / Shinkansen Transfer

Tokyo Station transfer includes pickup or drop-off at:

- Tokyo Station
- Tokyo Station Yaesu Exit
- Tokyo Station Marunouchi Exit
- Shinkansen platform meeting point
- Nearby Tokyo Station hotels

For Alpha 0.1, Tokyo Station / Shinkansen transfer should map to:

```text
Tokyo Station / Shinkansen
```

Airport Tokyo Station routes:

- HND ↔ Tokyo Station / Shinkansen
- NRT ↔ Tokyo Station / Shinkansen

AI should ask for:

- Train number, if available
- Arrival or departure time
- Exact exit or meeting point
- Number of suitcases

If the customer needs platform meet-and-greet inside the station, mark as:

```text
operator_review_required
```

## 15. Operator Review Required Cases

Mark as operator_review_required when:

- Route is not in the base price table
- Customer requests luxury vehicle
- Customer requests Rolls-Royce Ghost
- More than 9 passengers
- Multiple vehicles required
- Multi-day charter
- Route includes multiple stops
- Customer requests guide service
- Customer requires special VIP arrangement
- Pickup/drop-off location is difficult to access
- Service time is during major events or peak season
- Customer requests airport VIP meet-and-greet beyond normal signage
- Customer requests Shinkansen platform meet-and-greet inside Tokyo Station

## 16. AI Quote Example

### Customer Request

We are 4 people arriving at Haneda Airport and going to Shinjuku. We have 4 suitcases and prefer a Chinese-speaking driver.

### AI Quote Logic

Route:

HND ↔ Tokyo 23 Wards

Vehicle:

Alphard / Vellfire

Base price:

JPY 18,000

### Output

```json
{
  "service_type": "airport_pickup",
  "route": "Haneda Airport to Shinjuku",
  "vehicle_type": "Alphard / Vellfire",
  "estimated_price_jpy": 18000,
  "price_status": "fixed_price",
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
    "This is an estimated booking request, not final confirmation. Final price, vehicle availability, and driver arrangement require operator confirmation. If you accept the quote, a 20% deposit is required through PayPal to secure the booking."
  ]
}
```

## 17. Alpha 0.1 Principle

This table is not the final Tokyo pricing system.

Its purpose is to allow JTDOS Alpha 0.1 to generate realistic estimated quotes for the most common Tokyo airport transfer and surrounding area routes.

The system must always allow operator review and manual adjustment.
