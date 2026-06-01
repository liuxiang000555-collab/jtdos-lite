# JTDOS REAL PAYMENT INTEGRATION PLAN

## 1. Purpose

This document defines the technical plan for real payment integration for JTDOS Pro Cloud.

Target product:

- JTDOS Pro Cloud
- Price: USD 999 one-time setup
- Goal: customer pays, payment is verified server-side, Pro Cloud access is activated automatically

This document is only a design plan. It does not connect real Stripe, PayPal, or production payment APIs.

## 2. Why Frontend Payment Success Is Not Enough

JTDOS must never activate a paid Pro plan only because the browser says payment succeeded.

Frontend-only success is unsafe because:

- Browser state can be modified.
- A customer can fake local storage, query params, or client-side JavaScript.
- Network calls can be replayed or skipped.
- Payment may be pending, failed, cancelled, disputed, refunded, or blocked.
- A payment provider may show a temporary success page before final settlement or webhook confirmation.

Correct rule:

```text
Only a verified server-side payment webhook can activate Pro Cloud.
```

The frontend may show a temporary success message, but final entitlement must be written by the backend after webhook verification.

## 3. Stripe Checkout Flow

Recommended for JTDOS Pro Cloud SaaS-style checkout.

Flow:

1. User signs in or creates an account.
2. User opens `/upgrade`.
3. Backend creates a Stripe Checkout Session.
4. Backend includes metadata:
   - `user_id`
   - `organization_id`
   - `plan = pro`
   - `price_usd = 999`
   - `license_type = pro_cloud`
5. Frontend redirects user to Stripe Checkout.
6. User pays by card or supported payment method.
7. Stripe redirects user to success or cancel URL.
8. Backend waits for Stripe webhook.
9. Backend verifies webhook signature.
10. Backend checks the payment status.
11. Backend creates license record.
12. Backend updates `user.plan = pro`.
13. User sees Pro dashboard unlocked.

Recommended endpoint shape:

```text
POST /api/billing/stripe/create-checkout-session
POST /api/billing/stripe/webhook
GET /dashboard/billing
```

Stripe events to handle:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.dispute.created`

## 4. PayPal Checkout Flow

Recommended for Fast Track / manual invoice, not first-choice for automatic SaaS Pro activation.

Flow:

1. User contacts JTDOS or submits Pro Cloud request.
2. Backend creates PayPal order, or operator sends manual PayPal payment request.
3. User completes PayPal payment.
4. PayPal sends webhook to backend.
5. Backend verifies webhook signature with PayPal.
6. Backend checks capture status.
7. Backend creates license record if payment is completed.
8. Backend activates Pro access.

Recommended endpoint shape:

```text
POST /api/billing/paypal/create-order
POST /api/billing/paypal/capture-order
POST /api/billing/paypal/webhook
```

PayPal events to handle:

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`
- `CUSTOMER.DISPUTE.CREATED`

## 5. Payment Webhook Verification

Webhook verification is mandatory.

Stripe:

- Use `STRIPE_WEBHOOK_SECRET`.
- Verify `Stripe-Signature` header.
- Reject unsigned or invalid webhooks.
- Use idempotency on event id.

PayPal:

- Verify webhook signature using PayPal verification API or SDK.
- Reject invalid webhook payloads.
- Use idempotency on PayPal event id and capture id.

Storage rules:

- Store webhook event id.
- Store payment provider transaction id.
- Do not process the same payment twice.
- Do not activate a plan from frontend redirect alone.

## 6. `user.plan` Activation Logic

Activation should happen only after verified paid status.

Pseudo logic:

```text
if verified_webhook && payment_status == paid:
  create_or_update_license()
  update user.plan = pro
  update user.plan_status = active
  set activated_at
  unlock Pro dashboard
else:
  do not activate Pro
```

Recommended fields:

- `user.plan = pro`
- `user.plan_status = active`
- `license.plan = pro`
- `license.payment_status = paid`
- `license.activated_at = now`
- `license.transaction_id = provider transaction id`

## 7. License Record Creation Logic

Each successful payment should create one license record.

License fields:

```json
{
  "license_id": "lic_001",
  "user_id": "usr_001",
  "organization_id": "org_001",
  "plan": "pro",
  "price_usd": 999,
  "payment_provider": "stripe",
  "payment_status": "paid",
  "activated_at": "2026-06-01T00:00:00Z",
  "expires_at": "",
  "lifetime_access": true,
  "transaction_id": "pi_..."
}
```

Idempotency:

- If the same webhook arrives again, do not create duplicate licenses.
- If the same user pays twice accidentally, flag for operator review.

## 8. Pro Dashboard Unlock

Pro dashboard access should be checked server-side.

Access rule:

```text
user.plan == pro
and user.plan_status == active
and valid license exists
```

Pro dashboard unlocks:

- Custom price table configuration
- Lead storage settings
- Email / Telegram / Google Sheet notification settings
- AI Booking Pro mode
- JTDSS connector configuration screen
- Export leads

Lite users should see:

- Upgrade prompt
- Pro feature preview
- No access to real configuration or export

## 9. Failed / Cancelled Payment Handling

Failed payment:

- Keep `user.plan = lite`.
- Set `plan_status = pending_payment` or leave as `active` Lite.
- Show message: payment was not completed.
- Do not create active license.

Cancelled checkout:

- Keep `user.plan = lite`.
- Show safe retry option.
- Do not mark as paid.

Pending payment:

- Show "payment pending" state.
- Do not unlock Pro until provider sends confirmed paid webhook.

## 10. Refund / Dispute Handling

Refund:

- Mark license `payment_status = refunded`.
- Set `user.plan_status = inactive` or `cancelled`.
- Optionally keep account but lock Pro features.
- Notify operator.

Dispute:

- Mark license `payment_status = disputed`.
- Temporarily suspend Pro features or flag for manual review.
- Notify operator.

Chargeback:

- Lock Pro dashboard access.
- Preserve account and audit logs.
- Operator manually decides next action.

## 11. Test Mode Checklist

Before production:

- Use Stripe test mode keys only.
- Use PayPal sandbox only.
- Confirm no live secret keys in repository.
- Verify checkout session creation.
- Verify webhook signature validation.
- Test successful payment.
- Test cancelled payment.
- Test failed card payment.
- Test duplicate webhook delivery.
- Test refund event.
- Test dispute event if available.
- Confirm Pro dashboard unlocks only after webhook.
- Confirm frontend redirect alone does not unlock Pro.
- Confirm email notification after activation.
- Confirm logs do not expose customer payment details.

## 12. Production Launch Checklist

Before launch:

- Configure live Stripe or PayPal keys in server environment only.
- Configure webhook secret in server environment only.
- Confirm production webhook URL.
- Confirm HTTPS only.
- Confirm database backup.
- Confirm admin access to payments and licenses.
- Confirm invoice / receipt email behavior.
- Confirm tax/legal wording for USD 999 setup package.
- Confirm refund policy.
- Confirm support email.
- Confirm monitoring and error alerts.
- Confirm no API keys in GitHub public repo.
- Confirm no Private source download link exists in public checkout.

## 13. Security Risks

Risks:

- Client-side fake payment success.
- Webhook replay.
- Duplicate license creation.
- Exposed payment secret key.
- Incorrect refund handling.
- Accidental Private source delivery.
- Pro access without valid license.
- Customer PII in logs.
- Payment provider metadata leaking sensitive data.

Controls:

- Server-side webhook verification.
- Idempotent webhook handling.
- Environment variables only for secrets.
- No payment secrets in frontend.
- No API keys in GitHub.
- Mask customer contact fields in logs.
- Manual approval for Private / Enterprise.
- Separate Pro Cloud checkout from Private license process.

## 14. Recommended First Implementation

Recommended first production implementation:

```text
Stripe Checkout for JTDOS Pro Cloud USD 999
```

Reason:

- Better SaaS-style hosted checkout.
- Strong webhook support.
- Easier license activation flow.
- Cleaner billing dashboard.
- Easier future subscription support.

Recommended PayPal role:

```text
PayPal remains Fast Track / manual invoice option.
```

Reason:

- Good for international customers who prefer PayPal.
- Useful for manual onboarding.
- Less ideal as the first fully automated SaaS entitlement system.

Private Source License:

```text
Private Source License remains manual approval only.
```

Private / Enterprise must not be automatically paid and downloaded from public checkout. It requires contract, approval, scope confirmation, and manual delivery.
