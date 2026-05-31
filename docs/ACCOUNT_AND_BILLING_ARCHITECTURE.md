# JTDOS ACCOUNT AND BILLING ARCHITECTURE

## 1. Purpose

This document defines the first account, tenant, license, and billing architecture for JTDOS Pro Cloud.

JTDOS Lite remains a public demo. JTDOS Pro Cloud is the paid hosted product that unlocks custom business configuration after payment and onboarding.

This Alpha/Beta architecture uses mock payment only. It does not connect to real PayPal, Stripe, JTDSS production, or automatic Private source delivery.

## 2. User Model

```json
{
  "user_id": "usr_001",
  "email": "owner@example.com",
  "name": "Operator Owner",
  "company": "Example Travel",
  "country": "Japan",
  "password_hash": "",
  "auth_provider": "email_password | google | magic_link",
  "plan": "lite",
  "plan_status": "active",
  "created_at": "2026-06-01T00:00:00Z",
  "updated_at": "2026-06-01T00:00:00Z"
}
```

Fields:

- `user_id`: Stable internal user identifier.
- `email`: Login and billing contact email.
- `name`: User display name.
- `company`: Company or agency name.
- `country`: Country of operation.
- `password_hash` or `auth_provider`: Authentication method.
- `plan`: `lite`, `pro`, or `private`.
- `plan_status`: `active`, `inactive`, `pending_payment`, or `cancelled`.
- `created_at`: User creation timestamp.
- `updated_at`: Last update timestamp.

## 3. Organization / Tenant Model

```json
{
  "organization_id": "org_001",
  "owner_user_id": "usr_001",
  "company_name": "Example Travel",
  "country": "Japan",
  "company_type": "Travel Agency",
  "regions": ["Tokyo", "Osaka", "Hokkaido"],
  "monthly_inquiries": "50-200",
  "created_at": "2026-06-01T00:00:00Z"
}
```

Fields:

- `organization_id`: Tenant identifier.
- `owner_user_id`: Owner account.
- `company_name`: Legal or operating company name.
- `country`: Company country.
- `company_type`: Travel agency, transfer operator, OTA, supplier, creator, developer, or other.
- `regions`: Japan regions served.
- `monthly_inquiries`: Estimated monthly customer inquiries.
- `created_at`: Tenant creation timestamp.

## 4. Subscription / License Model

```json
{
  "license_id": "lic_001",
  "user_id": "usr_001",
  "organization_id": "org_001",
  "plan": "pro",
  "price_usd": 999,
  "payment_provider": "mock | paypal | stripe",
  "payment_status": "paid",
  "activated_at": "2026-06-01T00:00:00Z",
  "expires_at": "",
  "lifetime_access": true,
  "transaction_id": "mock_txn_001"
}
```

Fields:

- `license_id`: License identifier.
- `user_id`: Paying user.
- `organization_id`: Tenant receiving access.
- `plan`: `lite`, `pro`, or `private`.
- `price_usd`: Paid amount.
- `payment_provider`: Mock for Beta, later PayPal or Stripe.
- `payment_status`: `pending`, `paid`, `failed`, `refunded`, or `cancelled`.
- `activated_at`: Pro activation timestamp.
- `expires_at` or `lifetime_access`: License duration.
- `transaction_id`: Payment provider transaction identifier.

## 5. Pro Cloud Entitlement

Pro users can access:

- Pro dashboard
- Custom price table configuration
- Lead storage settings
- Email / Telegram / Google Sheet notification settings
- AI Booking Pro mode
- JTDSS connector configuration screen
- Export leads

Pro Cloud unlocks product configuration. It does not guarantee final production deployment until the customer completes onboarding and required external service setup.

## 6. Lite Limitation

Lite users:

- Can use public demo
- Use mock data only
- Have no custom price table
- Have no real notification
- Have no JTDSS connector
- Have no lead export

Lite is suitable for evaluation, demos, and developer review.

## 7. Private License

Private / Enterprise is not automatically delivered from public checkout.

Private / Enterprise requires:

- Manual approval
- Source package delivery
- Private deployment
- Custom contract
- Commercial license agreement

The public checkout must not provide automatic source download, production JTDSS access, or supplier network access.

## 8. Mock Upgrade Flow

The Beta mock upgrade flow:

1. User visits `/upgrade`.
2. User clicks `Upgrade to Pro`.
3. Frontend calls `POST /api/billing/mock-upgrade`.
4. API returns:

```json
{
  "success": true,
  "plan": "pro",
  "payment_status": "paid",
  "message": "Pro Cloud activated in mock mode."
}
```

This is only a development and sales demo flow. Real payment providers must be integrated later with webhook verification, fraud checks, entitlement persistence, and invoice records.

## 9. Future Real Payment Recommendation

Recommended production path:

1. Stripe Checkout or PayPal Checkout for USD 999 Pro Cloud setup.
2. Payment webhook verifies paid status server-side.
3. Server creates or updates user license.
4. User receives Pro entitlement.
5. Admin dashboard shows payment and onboarding status.
6. Private / Enterprise remains manual approval only.

Never activate paid access from client-side payment success alone.
