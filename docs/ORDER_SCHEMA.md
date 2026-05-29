# JTDOS ORDER SCHEMA

## 1. Purpose

This document defines the standard order structure for JTDOS Alpha 0.1.

JTDOS must convert customer inquiries into structured transportation orders that can be sent to the existing JTDSS backend, Email, WhatsApp, and Telegram.

The order schema must support:

* Airport pickup
* Airport drop-off
* Point-to-point transfer
* Charter service
* Multi-day charter service

## 2. Supported Service Types

### 2.1 Airport Pickup

Customer arrives at an airport and needs a driver to pick them up.

Examples:

* Haneda Airport to Shinjuku
* New Chitose Airport to Sapporo city
* Kansai Airport to Osaka city

### 2.2 Airport Drop-off

Customer needs a driver to send them from hotel or city location to airport.

Examples:

* Shinjuku to Haneda Airport
* Sapporo city to New Chitose Airport
* Kyoto hotel to Kansai Airport

### 2.3 Point-to-Point Transfer

Customer needs transportation between two non-airport locations.

Examples:

* Tokyo hotel to Hakone ryokan
* Osaka city to Kyoto hotel
* Sapporo hotel to Niseko

### 2.4 Charter Service

Customer needs a vehicle and driver for a fixed time period.

Examples:

* Tokyo 10-hour charter
* Sapporo city sightseeing charter
* Osaka-Kyoto-Nara one-day charter

### 2.5 Multi-Day Charter Service

Customer needs continuous charter service for multiple days.

Examples:

* Hokkaido 5-day charter
* Tokyo + Fuji + Hakone 3-day charter
* Kansai 4-day private tour

## 3. Supported Initial Regions

JTDOS Alpha 0.1 supports the following regions:

### 3.1 Tokyo and Surrounding Area

Includes:

* Tokyo 23 wards
* Haneda Airport
* Narita Airport
* Yokohama
* Hakone
* Fuji area
* Nikko
* Kamakura
* Kawaguchiko

### 3.2 Osaka and Surrounding Area

Includes:

* Osaka city
* Kansai Airport
* Kyoto
* Nara
* Kobe
* Wakayama

### 3.3 Hokkaido All Area

Includes:

* Sapporo
* New Chitose Airport
* Otaru
* Niseko
* Rusutsu
* Furano
* Biei
* Asahikawa
* Lake Toya
* Noboribetsu
* Hakodate
* Tomamu
* Kiroro

## 4. Supported Vehicle Types

### 4.1 Standard Premium Van

* Toyota Alphard
* Toyota Vellfire

Recommended for:

* 1–4 passengers
* 1–4 large suitcases
* Families
* Business travelers
* Premium transfer customers

### 4.2 Large Van

* Toyota HiAce

Recommended for:

* 5–9 passengers
* Large luggage groups
* Ski travelers
* Family groups
* Small tour groups

### 4.3 Luxury Business Vehicles

Only available in Tokyo and Osaka areas at Alpha 0.1 stage.

Supported models:

* Lexus LM550
* Mercedes-Benz S400
* Mercedes-Benz S500
* Rolls-Royce Ghost

Recommended for:

* VIP customers
* Business reception
* Luxury travel
* Executive airport transfer
* High-end customized tours

## 5. Currency Rules

Primary currency:

* JPY

Reference display currency:

* USD

Important:

* All internal pricing and final settlement should be based on JPY.
* USD price is only used as reference display.
* Exchange rate should be configurable in the system settings.

## 6. Order Destination Channels

JTDOS Alpha 0.1 must support sending generated orders to:

1. Existing JTDSS backend
2. Email
3. WhatsApp
4. Telegram

The first priority is:

AI Agent -> Booking Request -> Operator Confirmation by Liu Xiang -> Existing JTDSS Backend

Email, WhatsApp, and Telegram are used as backup or notification channels.

## 7. Standard Order Fields

```json
{
  "order_id": "",
  "source": "",
  "service_type": "",
  "region": "",
  "pickup_location": "",
  "dropoff_location": "",
  "pickup_date": "",
  "pickup_time": "",
  "flight_number": "",
  "arrival_airport": "",
  "departure_airport": "",
  "passenger_count": 0,
  "luggage_count": 0,
  "ski_equipment_count": 0,
  "child_seat_required": false,
  "child_seat_count": 0,
  "preferred_language": "",
  "vehicle_type": "",
  "vehicle_model_preference": "",
  "charter_days": 0,
  "charter_hours_per_day": 0,
  "itinerary_text": "",
  "customer_name": "",
  "customer_country": "",
  "customer_phone": "",
  "customer_email": "",
  "customer_whatsapp": "",
  "customer_wechat": "",
  "line_contact": "",
  "primary_contact_channel": "",
  "price_jpy": 0,
  "price_usd_reference": 0,
  "price_status": "",
  "deposit_required": true,
  "deposit_rate": 0.2,
  "deposit_amount_jpy": 0,
  "paypal_payment_required": true,
  "cancellation_policy": "Free cancellation 7 days or more before service date; 10% of total order amount charged within 7 days.",
  "final_confirmation_required_by_operator": "Liu Xiang",
  "payment_status": "",
  "order_status": "",
  "special_requests": "",
  "internal_notes": "",
  "created_at": "",
  "updated_at": ""
}
```

## 8. Required Fields by Service Type

### 8.1 Airport Pickup Required Fields

Required:

* service_type
* arrival_airport
* pickup_date
* pickup_time
* flight_number
* dropoff_location
* passenger_count
* luggage_count
* preferred_language
* vehicle_type
* customer contact method

### 8.2 Airport Drop-off Required Fields

Required:

* service_type
* pickup_location
* departure_airport
* pickup_date
* pickup_time
* passenger_count
* luggage_count
* preferred_language
* vehicle_type
* customer contact method

### 8.3 Point-to-Point Required Fields

Required:

* service_type
* pickup_location
* dropoff_location
* pickup_date
* pickup_time
* passenger_count
* luggage_count
* preferred_language
* vehicle_type
* customer contact method

### 8.4 Charter Required Fields

Required:

* service_type
* region
* pickup_date
* pickup_time
* charter_hours_per_day
* itinerary_text
* passenger_count
* luggage_count
* preferred_language
* vehicle_type
* customer contact method

### 8.5 Multi-Day Charter Required Fields

Required:

* service_type
* region
* start_date
* end_date
* charter_days
* charter_hours_per_day
* itinerary_text
* passenger_count
* luggage_count
* preferred_language
* vehicle_type
* customer contact method

## 9. Order Status

Supported order statuses:

* draft
* quote_generated
* booking_request_created
* operator_review_required
* operator_confirmed
* sent_to_jtdss
* driver_pending
* driver_accepted
* driver_rejected
* completed
* cancelled

## 10. Payment Status

Supported payment statuses:

* unpaid
* deposit_paid
* fully_paid
* pay_on_site
* cancelled
* refunded

## 11. Price Status

Supported price statuses:

* fixed_price
* estimated
* operator_review_required
* confirmed

Important:

`fixed_price` means the route price does not need manual price confirmation.

It does not mean vehicle availability, driver assignment, payment, or deposit has been confirmed.

## 12. Alpha 0.1 Rule

In Alpha 0.1, the system does not need to complete payment.

However, if the customer accepts the quote, a 20% deposit is required through the operator's PayPal to secure the booking.

AI-generated quotes are booking requests / estimated quotes only.

Final confirmation requires operator Liu Xiang to confirm final price, vehicle availability, driver arrangement, and deposit.

The goal is to complete:

Customer inquiry
-> AI extracts order information
-> AI generates quote
-> AI creates booking request
-> Operator Liu Xiang confirms details and deposit
-> Order is sent or synchronized to JTDSS
-> Order notification is sent by Email / WhatsApp / Telegram
