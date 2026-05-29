# JTDOS AI AGENT FAQ SEED 100

## Purpose

This file provides FAQ seed answers for the JTDOS AI Sales Agent.

These answers follow `docs/REAL_BUSINESS_RULES_V1.md` and should be used when answering customer questions.

They also follow `docs/REAL_PRICING_AND_CHARTER_RULES_V1.md` for pricing, charter, multi-day charter, language service, and operator review rules.

## Core FAQ Answers

### Is the AI quote final?

No. It is an estimated booking request, not final confirmation. Final price, vehicle availability, and driver arrangement require operator confirmation by Liu Xiang.

For normal airport transfer and point-to-point routes that exist in the real price table, the AI may show a fixed price. Fixed price means the route price does not need manual price confirmation. It does not mean a driver has accepted the order.

### Is a deposit required?

Yes. If the customer accepts the quote, a 20% deposit of the total order amount is required through the operator's PayPal to secure the booking.

### What is the cancellation policy?

Cancellation is free 7 days or more before the service date, including the 7th day. Within 7 days, 10% of the total order amount will be charged.

### Are highway tolls and parking included?

For standard airport transfer and point-to-point transfer orders, highway toll and parking fee are included by default.

### What is not included?

Extra waiting fee, signage / placard service, child seat fee, additional stop, route change, extra hour, guide service, entrance tickets, meals, accommodation, and customer personal expenses are not included unless specifically confirmed.

### Can we stop for shopping, photos, or lunch during a transfer?

For airport transfer and point-to-point transfer, shopping stops, photo stops, restaurant stops, and sightseeing stops are not included by default.

A short restroom stop at a convenience store may be allowed for about 10 minutes.

If the customer wants shopping, photos, meals, or sightseeing on the way, the service should be treated as charter rather than point-to-point transfer.

### What is the standard one-day charter time?

Standard one-day charter is 10 hours.

### Can customers book 4-hour, 5-hour, 6-hour, or 8-hour charter?

Yes, but short charter under 10 hours requires manual review. Within 4 hours, price may be discounted by up to 40%. More than 4 hours is generally calculated as one-day charter.

### What is the charter extra time fee?

JPY 3,000 per 30 minutes. If the exceeded time is less than 30 minutes, no extra fee applies.

### What is included in charter price?

Charter price includes driver, vehicle, fuel, highway toll, parking fee, and driver meal.

### What is long-distance charter?

If one-way driving distance exceeds 150 km, it should be treated as long-distance charter and may require operator review.

### What is the multi-day charter driver accommodation fee?

Driver accommodation allowance is JPY 8,000 per night.

### What is the standard daily service time for multi-day charter?

10 hours per day.

### Does multi-day charter require operator review?

Yes. Multi-day charter can be automatically estimated, but operator review and final confirmation are required.

### What is the default driver language?

Default service is Chinese-speaking service when available.

### Does English-speaking driver request require review?

Yes. English-speaking driver request must be marked for operator review.

### What if the customer needs English, Spanish, or other-language guide explanation?

A local licensed or professional guide may be required. Guide fee estimate is JPY 20,000–30,000 per day, and operator review is required.

### Is Chinese simple explanation charged?

No. Chinese simple sightseeing explanation has no additional charge and does not automatically require operator review.

### What if a Chinese-speaking customer wants the driver to accompany them outside the vehicle?

Add JPY 10,000 per day. This is simple accompanying support, not professional licensed guide service.

### Is the driver a professional guide?

No. The driver is mainly responsible for transportation and is not a professional tour guide unless guide service is separately arranged.

### What is the airport pickup waiting time?

Standard airport pickup free waiting time is 90 minutes after actual flight arrival. During peak season, it is reduced to 60 minutes.

### What is the hotel or city pickup waiting time?

Free waiting time is 30 minutes after the scheduled pickup time.

### What is the no-show rule?

If the customer exceeds the free waiting time and cannot be contacted, the order is treated as no-show and the driver may leave.

### What is the extra waiting fee?

JPY 3,000 per 30 minutes unless manually adjusted by the operator.

### What is the night surcharge?

Night surcharge applies between 21:00 and 07:00 and is always +20% during night time. Peak season is reflected through peak_price, not through an extra +50% night surcharge. If the customer books at least 25 days before service date, early booking protection can use normal_price instead of peak_price, but night surcharge still applies for nighttime service.

### What is the signage fee?

Airport signage / placard service is optional and costs JPY 2,000.

### What is the child seat fee?

Child seat fee is JPY 1,000 per seat.

### Does stroller count as luggage?

Yes. Baby stroller must be counted as luggage.

### What if the customer has ski equipment?

The AI must ask for number of ski bags, snowboard bags, large suitcases, and passenger count. If customer has 4 passengers, 4 large suitcases, and ski/snowboard bags, HiAce is required.

### What are the primary contact channels?

WhatsApp, Email, and LINE. WeChat is not a primary channel for this project. Telegram is mainly for internal operator notification.

### What disclaimer should be included?

This is an estimated booking request, not final confirmation. Final price, vehicle availability, and driver arrangement require operator confirmation. If you accept the quote, a 20% deposit is required through PayPal to secure the booking.
