# JTDOS BASE PRICES - OSAKA / KANSAI

> Historical reference only.
>
> Formal Osaka / Kansai quote logic must use `database/jtdos_osaka_price_real_v1.json`.
> The human-readable real Osaka price table is `database/base_prices_osaka_real_v1.md`.
> The source PDF is only the original price source and must not be read by quote code.

## 1. Purpose

This document defines the first Osaka and Kansai area base price table for JTDOS Alpha 0.1.

The table supports estimated quotes for:

* Airport pickup
* Airport drop-off
* Point-to-point transfer
* Kansai surrounding area transfer
* Osaka / Kyoto / Nara / Kobe charter reference

All internal prices are based on JPY.

USD may be displayed as reference only.

## 2. Pricing Scope

This Alpha 0.1 price table supports:

* Kansai International Airport transfer
* Osaka city transfer
* Kyoto transfer
* Nara transfer
* Kobe transfer
* Wakayama reference transfer
* Kansai one-day charter reference

This table is used for estimated quote generation only.

Final price may require operator confirmation.

## 3. Vehicle Types

Supported vehicle classes:

### Alphard / Vellfire

Recommended for:

* 1–4 passengers
* 1–4 large suitcases
* Family travelers
* Business travelers
* Premium airport transfers

### HiAce

Recommended for:

* 5–9 passengers
* Large luggage groups
* Family groups
* Small tour groups

### Luxury Vehicles

Available mainly in Osaka and surrounding business areas:

* Lexus LM550
* Mercedes-Benz S400
* Mercedes-Benz S500
* Rolls-Royce Ghost

Luxury vehicle requests must be marked as:

```text
operator_review_required
```

AI must not guarantee availability.

## 4. Kansai Airport Transfer Base Price Table

| Route                              | Alphard / Vellfire JPY | HiAce JPY |
| ---------------------------------- | ---------------------: | --------: |
| KIX ↔ Osaka City                   |                 28,000 |    38,000 |
| KIX ↔ Kyoto City                   |                 45,000 |    58,000 |
| KIX ↔ Nara City                    |                 42,000 |    55,000 |
| KIX ↔ Kobe City                    |                 42,000 |    55,000 |
| KIX ↔ Universal Studios Japan Area |                 30,000 |    40,000 |
| KIX ↔ Wakayama City                |                 38,000 |    50,000 |

## 5. Kansai Point-to-Point Reference Table

| Route                                     | Alphard / Vellfire JPY | HiAce JPY |
| ----------------------------------------- | ---------------------: | --------: |
| Osaka City ↔ Kyoto City                   |                 35,000 |    48,000 |
| Osaka City ↔ Nara City                    |                 32,000 |    45,000 |
| Osaka City ↔ Kobe City                    |                 32,000 |    45,000 |
| Osaka City ↔ Universal Studios Japan Area |                 18,000 |    25,000 |
| Kyoto City ↔ Nara City                    |                 35,000 |    48,000 |
| Kyoto City ↔ Kobe City                    |                 48,000 |    65,000 |
| Kyoto City ↔ Osaka City                   |                 35,000 |    48,000 |

## 6. Kansai Charter Reference Price

Standard one-day charter is 10 hours.

Charter orders below 10 hours require manual review. Within 4 hours, price may be discounted by up to 40%; more than 4 hours is generally calculated as one-day charter.

| Charter Type                         | Alphard / Vellfire JPY | HiAce JPY |
| ------------------------------------ | ---------------------: | --------: |
| Osaka 6-hour charter                 |                 55,000 |    75,000 |
| Osaka 8-hour charter                 |                 70,000 |    90,000 |
| Osaka 10-hour charter                |                 85,000 |   110,000 |
| Kyoto 8-hour charter                 |                 75,000 |    95,000 |
| Kyoto 10-hour charter                |                 90,000 |   115,000 |
| Osaka → Kyoto → Nara 10-hour charter |                 95,000 |   125,000 |
| Osaka → Kobe 8-hour charter          |                 75,000 |    95,000 |
| Osaka → Wakayama 10-hour charter     |                 95,000 |   125,000 |

## 7. Luxury Vehicle Pricing Rule

Luxury vehicles are not automatically priced in Alpha 0.1.

Supported luxury vehicle types:

* Lexus LM550
* Mercedes-Benz S400
* Mercedes-Benz S500
* Rolls-Royce Ghost

If customer requests luxury vehicle:

```text
price_status = operator_review_required
quote_confidence = low
```

AI should say:

```text
Luxury vehicle availability and final price require operator confirmation.
```

Chinese:

```text
高级商务车或豪华车需要人工确认车辆空位和最终价格。
```

Japanese:

```text
高級車両の空き状況および最終料金は、オペレーターによる確認が必要です。
```

## 8. Waiting Time Rule

### Airport Arrival Pickup

Free waiting time:

```text
90 minutes after actual flight arrival
```

During peak season:

```text
60 minutes after actual flight arrival
```

After free waiting time:

```text
JPY 3,000 per 30 minutes
```

### Hotel / City Pickup

Free waiting time:

```text
30 minutes after scheduled pickup time
```

After free waiting time:

```text
JPY 3,000 per 30 minutes
```

## 9. Night Surcharge Rule

Night surcharge applies when service time falls between:

```text
21:00–07:00
```

Airport pickup / drop-off night surcharge:

* Night time is always base price +20%
* Peak season is reflected through peak_price
* Booking at least 25 days before service date can use normal_price instead of peak_price
* Early booking protection does not waive night surcharge

## 10. Signage / Placard Rule

Airport signage / placard service:

```text
JPY 2,000
```

AI should ask whether the customer needs signage service for airport pickup.

## 11. Child Seat Rule

Child seat fee:

```text
JPY 1,000 per seat
```

AI must ask:

* Number of children
* Age of children
* Whether child seat is required

## 12. Toll and Parking Rule

For standard transfer orders, highway toll and parking fee are included by default.

For routes such as:

* Kyoto
* Nara
* Kobe
* Wakayama
* KIX airport transfers

Extra waiting fee, signage, child seat, additional stop, route change, extra hour, guide service, entrance tickets, meals, accommodation, and customer personal expenses are not included unless specifically confirmed.

## 13. Kyoto Special Notes

Kyoto has special operational risks:

* Narrow streets
* Limited hotel parking
* Tourist area traffic restrictions
* Seasonal congestion
* Difficult pickup/drop-off near temples and old town areas

If pickup/drop-off is inside Kyoto tourist areas, AI should add:

```text
Exact pickup/drop-off point may require operator confirmation due to Kyoto road and parking restrictions.
```

Chinese:

```text
京都部分酒店、寺庙及老城区道路较窄，具体上下车地点可能需要人工确认。
```

Japanese:

```text
京都の一部ホテル、寺院周辺、旧市街エリアでは道路幅や駐車制限により、乗降場所の確認が必要な場合があります。
```

## 14. Operator Review Required Cases

Mark as operator_review_required when:

* Route is not in the base price table
* Customer requests luxury vehicle
* Customer requests Rolls-Royce Ghost
* More than 9 passengers
* Multiple vehicles required
* Multi-day charter
* Route includes multiple stops
* Customer requests guide service
* Customer requires special VIP arrangement
* Pickup/drop-off location is difficult to access
* Kyoto hotel or temple area pickup/drop-off is unclear
* Service time is during major events or peak season
* Customer requests airport VIP meet-and-greet beyond normal signage

## 15. AI Quote Example

### Customer Request

```text
We are 4 people arriving at Kansai Airport and going to Osaka city hotel. We have 4 suitcases and prefer a Chinese-speaking driver.
```

### AI Quote Logic

Route:

```text
KIX ↔ Osaka City
```

Vehicle:

```text
Alphard / Vellfire
```

Base price:

```text
JPY 28,000
```

### Output

```json
{
  "service_type": "airport_pickup",
  "route": "Kansai Airport to Osaka City",
  "vehicle_type": "Alphard / Vellfire",
  "estimated_price_jpy": 28000,
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

## 16. Alpha 0.1 Principle

This table is not the final Kansai pricing system.

Its purpose is to allow JTDOS Alpha 0.1 to generate realistic estimated quotes for the most common Osaka, Kyoto, Nara, Kobe, and Kansai Airport routes.

The system must always allow operator review and manual adjustment.
