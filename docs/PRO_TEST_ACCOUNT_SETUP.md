# JTDOS PRO TEST ACCOUNT SETUP

## 1. Purpose

This document defines the internal Pro Test Account used for daily JTDOS Pro real conversation validation.

This account is not a real paid customer account. It does not represent a real Stripe, PayPal, bank transfer, or production license purchase.

## 2. Account

- Email: `pro-test@jtdos.com`
- Account Type: Internal Pro Test Account
- Organization: `JTDOS Internal Pro Test`
- Role: owner
- Plan: `pro`
- Plan Status: `active`
- Payment Status: `test_paid`
- Payment Provider: `manual_test`
- License Source: `manual_test`
- License Status: `active`
- Environment: staging / beta
- Purpose: Daily real conversation validation for JTDOS Pro.

## 3. Current Implementation

The current public-lite app does not yet have a production Supabase Auth login flow connected to the dashboard.

For now, the Pro Test Account is implemented as a safe mock / manual Pro test mode:

- `/dashboard?plan=pro`
- `/dashboard?mode=pro-test`
- `/ai-booking?mode=pro-test`

These URLs show the internal Pro test state and clearly say that no real payment was processed.

Ordinary visitors who open `/dashboard` without the Pro test parameter remain in Lite demo mode and do not receive Pro access.

## 4. Daily Validation Workflow

Use the Pro test mode to run daily real conversation checks:

1. Open `/ai-booking?mode=pro-test`.
2. Test common customer conversations in Chinese, English, and Spanish.
3. Verify service type detection: pickup, drop-off, point-to-point, one-day charter, multi-day charter.
4. Verify region detection: Tokyo, Osaka / Kansai, Hokkaido.
5. Verify airport and destination recognition.
6. Verify vehicle recommendation: Alphard / Vellfire or HiAce.
7. Verify special request handling: ski bags, child seats, stroller, signage, English driver, female driver, luxury vehicle, multiple vehicles.
8. Verify quote safety: unknown routes, multi-day charter, luxury vehicle, multiple vehicles, language driver requests require review.
9. Verify the response feels like a travel sales consultant, not an internal dispatch form.
10. Record failed cases and classify them as P0 / P1 / P2.

## 5. How To Disable

Current mock mode can be disabled by removing the temporary query-based Pro test access in:

- `backend/account/pro_test_account.js`
- `/dashboard` route handling
- `/ai-booking?mode=pro-test` banner behavior

Future Supabase implementation should disable this account by setting:

- `licenses.license_status = cancelled`
- `organizations.plan = lite`
- `organizations.plan_status = inactive`

## 6. Safety Rules

This internal Pro Test Account:

- Is not a real customer account.
- Does not prove real payment.
- Does not activate production deployment.
- Does not deliver Private Source License code.
- Does not connect real JTDSS.
- Does not bypass future Stripe / PayPal webhook verification.
- Must never expose Supabase service role keys, API keys, PayPal links, or private customer data.

The dashboard must say:

> Pro features unlocked in test mode. No real payment was processed.

## 7. Future Supabase Records

When real Supabase Auth is connected, create these records through an authenticated server-side admin flow:

- `profiles`: `pro-test@jtdos.com`
- `organizations`: `JTDOS Internal Pro Test`, `plan = pro`, `plan_status = active`
- `memberships`: `role = owner`
- `licenses`: `plan = pro`, `license_status = active`, `payment_status = test_paid`, `payment_provider = manual_test`, `price_usd = 999`
- `audit_logs`: `action = manual_pro_test_account_created`

Do not insert these records from frontend code. Use a trusted server-side script or Supabase dashboard with service role permission.

## 8. Relationship To Real Billing

Real Pro Cloud activation must later use server-side payment verification:

- Stripe Checkout webhook for SaaS-style Pro Cloud
- PayPal manual / invoice flow for Fast Track where appropriate
- Manual approval for Private Source License

The manual Pro Test Account must not change or weaken that future billing logic.
