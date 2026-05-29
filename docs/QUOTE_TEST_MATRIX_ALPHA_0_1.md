# JTDOS QUOTE TEST MATRIX ALPHA 0.1

## 1. Purpose

This document defines the required quote tests for JTDOS Alpha 0.1.

The purpose is to verify that Hokkaido, Tokyo, and Osaka real price tables work correctly with the unified JTDOS pricing rules.

## 2. Test Regions

- Hokkaido
- Tokyo
- Osaka / Kansai

## 3. Common Expected Rules

Every successful fixed-price quote must include:

- price_status = fixed_price
- quote_confidence = high
- operator_review_required = false
- currency = JPY
- included includes Driver, Vehicle, Fuel, Highway toll, Parking fee
- excluded does not include Highway toll or Parking fee

## 4. Hokkaido Tests

### H-001 CTS to Sapporo Alphard Daytime

Input:
- region: Hokkaido
- route: CTS → Sapporo
- vehicle: Alphard/Vellfire
- service_time: 14:00
- non-peak date

Expected:
- fixed_price
- operator_review_required = false
- included includes toll and parking

### H-002 CTS to Niseko HiAce Night Non-Peak

Input:
- region: Hokkaido
- route: CTS → Niseko
- vehicle: HiAce
- service_time: 22:30
- non-peak date

Expected:
- final_price = normal_price * 1.2
- night_surcharge_rate = 0.2

### H-003 CTS to Niseko HiAce Peak Daytime Early Booking

Input:
- region: Hokkaido
- route: CTS → Niseko
- vehicle: HiAce
- service_date: peak season
- booking_created_at: 25+ days before service date
- service_time: 14:00

Expected:
- final_price = normal_price
- early_booking_protection_applied = true
- applied_base_price_type = normal_price

### H-004 CTS to Niseko HiAce Peak Night Late Booking

Input:
- region: Hokkaido
- route: CTS → Niseko
- vehicle: HiAce
- service_date: peak season
- booking_created_at: less than 25 days before service date
- service_time: 22:30

Expected:
- final_price = peak_price * 1.2
- night_surcharge_rate = 0.2
- applied_base_price_type = peak_price

### H-005 Hokkaido Unknown Route

Input:
- region: Hokkaido
- route: CTS → Unknown Destination

Expected:
- operator_review_required = true
- quote_confidence = low

## 5. Tokyo Tests

### T-001 HND to Tokyo 23 Wards Alphard Daytime

Input:
- region: Tokyo
- route: HND → Tokyo 23 Wards
- vehicle: Alphard/Vellfire
- service_time: 14:00
- non-peak date

Expected:
- fixed_price
- operator_review_required = false

### T-002 HND to Tokyo 23 Wards Alphard Night Non-Peak

Input:
- region: Tokyo
- route: HND → Tokyo 23 Wards
- vehicle: Alphard/Vellfire
- service_time: 22:00
- non-peak date

Expected:
- final_price = normal_price * 1.2
- night_surcharge_rate = 0.2

### T-003 NRT to Tokyo 23 Wards HiAce Daytime

Input:
- region: Tokyo
- route: NRT → Tokyo 23 Wards
- vehicle: HiAce
- service_time: 13:00

Expected:
- fixed_price
- operator_review_required = false

### T-004 Tokyo Unknown Route

Input:
- region: Tokyo
- route: Tokyo 23 Wards → Unknown Destination

Expected:
- operator_review_required = true
- quote_confidence = low

## 6. Osaka Tests

### O-001 KIX to Osaka City Alphard Daytime

Input:
- region: Osaka
- route: KIX → Osaka City
- vehicle: Alphard/Vellfire
- service_time: 14:00
- non-peak date

Expected:
- fixed_price
- operator_review_required = false

### O-002 KIX to Kyoto City HiAce Daytime

Input:
- region: Osaka
- route: KIX → Kyoto City
- vehicle: HiAce
- service_time: 13:00

Expected:
- fixed_price
- operator_review_required = false

### O-003 KIX to Osaka City Alphard Night Non-Peak

Input:
- region: Osaka
- route: KIX → Osaka City
- vehicle: Alphard/Vellfire
- service_time: 22:30

Expected:
- final_price = normal_price * 1.2
- night_surcharge_rate = 0.2

### O-004 Osaka Unknown Route

Input:
- region: Osaka
- route: Osaka City → Unknown Destination

Expected:
- operator_review_required = true
- quote_confidence = low

### O-005 14-Seater Request

Input:
- region: Osaka
- route: KIX → Osaka City
- vehicle: 14-Seater

Expected:
- operator_review_required = true
- price_status = operator_review_required

## 7. Special Rule Tests

### S-001 Signage Fee

Input:
- signage_required = true

Expected:
- signage_jpy = 2000

### S-002 Child Seat Fee

Input:
- child_seat_count = 2

Expected:
- child_seat_jpy = 2000

### S-003 Transfer With Shopping Stop

Input:
- service_type = point_to_point
- customer_request includes shopping stop

Expected:
- recommend_service_type = charter
- message explains this is charter, not point-to-point transfer

### S-004 Ski Equipment Rule

Input:
- region = Hokkaido
- passengers = 4
- luggage = 4
- ski_bags = 1

Expected:
- recommended_vehicle = HiAce
- operator_review_required = true

## 8. Pass Criteria

JTDOS Alpha 0.1 quote engine passes only if:

- All three regions can quote from real JSON files
- Normal routes return fixed_price
- Unknown routes require operator review
- Toll and parking are included
- Night +20% works
- Peak early booking rule works
- Special requests trigger correct operator review logic
