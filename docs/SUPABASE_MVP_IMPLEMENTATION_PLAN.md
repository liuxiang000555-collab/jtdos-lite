# JTDOS SUPABASE MVP IMPLEMENTATION PLAN

## 1. Purpose

This document defines the Supabase MVP implementation plan for upgrading JTDOS Pro Cloud from mock account / mock upgrade into a real authenticated SaaS foundation.

This plan does not connect real Supabase, Stripe, PayPal, or production services yet.

## 2. Why Supabase

Supabase is a good MVP foundation for JTDOS Pro Cloud because:

- Auth + Database are available together.
- It is suitable for early SaaS MVPs.
- It works well with Vercel.
- It supports users, organizations, memberships, licenses, leads, price tables, and integrations.
- It provides Row Level Security (RLS), which is important for tenant isolation.
- It can later support storage, edge functions, webhooks, and admin workflows.

## 3. Environment Variables

Future server / Vercel environment variables:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Rules:

- `SUPABASE_ANON_KEY` may be used by frontend Supabase client when RLS is correctly enabled.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in public pages, browser JavaScript, GitHub, logs, or API responses.

## 4. Tables

MVP tables:

- `profiles`
- `organizations`
- `memberships`
- `licenses`
- `leads`
- `organization_settings`
- `price_tables`
- `integrations`
- `audit_logs`

Table purpose:

- `profiles`: User profile linked to `auth.users`.
- `organizations`: Tenant / company workspace.
- `memberships`: User-to-organization role mapping.
- `licenses`: Commercial entitlement record.
- `leads`: Contact / Pro Beta / customer inquiry records.
- `organization_settings`: Per-tenant business configuration.
- `price_tables`: Organization-specific Pro price tables.
- `integrations`: Organization-specific Email, Telegram, Google Sheets, JTDSS, or other integration settings.
- `audit_logs`: Key action history for debugging and accountability.

## 5. Lead Ownership Strategy

JTDOS has two lead sources.

### Public Website Lead

Public website lead:

```json
{
  "organization_id": null,
  "source": "public_contact",
  "lead_status": "new",
  "lead_type": "pro_beta"
}
```

Public website leads come from `/contact` or Pro Cloud / Private request forms. They are not attached to a tenant yet. Insert should happen through a trusted server-side API using service role credentials, not direct anonymous client insert.

### Logged-In Pro Organization Lead

Logged-in Pro organization lead:

```json
{
  "organization_id": "org_001",
  "source": "pro_booking_widget",
  "lead_status": "new",
  "lead_type": "booking_request"
}
```

Pro leads belong to the current organization and should be visible only to users with membership in that organization.

Lead lifecycle:

- `new`
- `contacted`
- `qualified`
- `won`
- `lost`
- `spam`

Lead types:

- `pro_beta`
- `private_license`
- `booking_request`
- `partnership`
- `support`

## 6. Organization Settings

`organization_settings` stores per-tenant business defaults:

- default currency
- USD/JPY rate
- timezone
- booking language default
- customer contact email / WhatsApp / LINE
- Fast Track enabled flag

This table should not store secrets. It is for business settings that are safe for tenant admins.

## 7. Audit Logs

`audit_logs` records important actions:

- Pro activation
- price table changes
- integration changes
- lead status changes
- license status changes
- payment webhook events
- JTDSS connector configuration changes

Audit logs should be inserted by trusted backend code using service role credentials. Clients should not directly insert audit logs.

## 8. Price Table Versioning

`price_tables` supports:

- `status`: `draft`, `active`, `archived`
- `version`
- `effective_from`
- `effective_to`
- `created_by`
- `updated_by`

This allows operators to prepare new price tables without immediately affecting live quote generation.

## 9. Integration Security

`integrations.config` should store non-sensitive configuration only.

Do not store plaintext:

- API keys
- tokens
- private keys
- webhook secrets
- service account private keys

Future production should use encrypted storage or an external secret manager for integration secrets.

Integration status values:

- `inactive`
- `active`
- `error`
- `disabled`

## 10. Auth Flow

Recommended MVP auth flow:

1. User signs up with email/password or magic link.
2. Supabase creates `auth.users` record.
3. Backend or database trigger creates `profiles` record.
4. App creates an `organizations` record.
5. App creates owner `memberships` record.
6. Organization default plan is `lite`.
7. User can access dashboard in Lite mode.
8. Pro features remain locked until license is active.

Default organization state:

```json
{
  "plan": "lite",
  "plan_status": "active"
}
```

## 11. Pro Activation Flow

### Current Stage

Current public-lite uses mock upgrade only:

- `/upgrade`
- `POST /api/billing/mock-upgrade`
- Local mock Pro state
- No real payment
- No real database entitlement

### Supabase MVP Stage

Mock upgrade can create a development license record:

1. User signs in.
2. User clicks mock upgrade in development.
3. Backend creates a `licenses` row with:
   - `plan = pro`
   - `payment_provider = mock`
   - `payment_status = paid`
   - `price_usd = 999`
4. Backend updates `organizations.plan = pro`.
5. Dashboard unlocks Pro features based on server-side license check.

### Future Stripe Stage

Production activation:

1. User starts Stripe Checkout.
2. Stripe webhook verifies payment.
3. Backend creates `licenses` row.
4. Backend updates `organizations.plan = pro`.
5. Dashboard unlocks Pro features.

Important:

```text
Frontend redirect success must not activate Pro. Only verified server-side webhook can activate production Pro.
```

## 12. Security Rules

Mandatory security rules:

- Never trust `localStorage` plan.
- Never trust query params like `?plan=pro`.
- All Pro APIs must check server-side license and organization plan.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- RLS must be enabled.
- Users can only access their own profile.
- Users can only access organizations where they have membership.
- Users can only access leads, licenses, price tables, and integrations belonging to their organization.
- Public leads with `organization_id = null` should not be readable by ordinary frontend clients.
- Organization members can read their own organization settings.
- Owner/admin can update organization settings.
- Members can read price tables.
- Owner/admin can write price tables.
- Owner/admin can read/write integrations because integration config may reveal operational setup.
- Audit logs are readable by organization members and inserted by trusted backend code.
- Private Source License must never be downloaded automatically through the public app.

RLS implementation notes:

- Public Contact leads must be inserted only through a trusted server-side API using the Supabase service role key.
- Do not create an anonymous insert policy for `public.leads` unless rate limits, spam controls, and abuse monitoring are added first.
- Membership checks should use server-side / database helper functions instead of recursive self-referencing policies on `memberships`.
- Payment, license, organization plan changes, and audit log inserts should be handled by trusted backend code with service role credentials.
- `updated_at` is maintained by database triggers for mutable tables.

## 13. Migration Steps

### Step 1: Add Schema

- Create Supabase project.
- Run `database/supabase_schema.sql`.
- Confirm tables, indexes, and RLS policies exist.

### Step 2: Add Supabase Client

- Add Supabase client dependency.
- Configure `SUPABASE_URL`.
- Configure `SUPABASE_ANON_KEY`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

### Step 3: Add Auth Pages

- Add sign up page.
- Add login page.
- Add logout action.
- Support email/password or magic link first.

### Step 4: Add Protected Dashboard

- Replace mock localStorage plan with authenticated session.
- Dashboard requires logged-in user.
- Lite users can view dashboard preview.
- Pro features require active license.

### Step 5: Add License Check

- Add server-side helper:
  - load user
  - load membership
  - load organization
  - load active license
  - return entitlement

### Step 6: Replace Mock Upgrade With DB-Backed Upgrade

- In development, mock upgrade writes a license row.
- It updates organization plan to Pro.
- It does not connect real payment.

### Step 7: Add Stripe Later

- Add Stripe Checkout creation.
- Add Stripe webhook endpoint.
- Verify webhook signature.
- Create license only after verified payment.

## 14. Future Test Plan

Future tests:

- User signup creates profile.
- User signup creates Lite organization.
- User signup creates owner membership.
- Lite user cannot access Pro-only APIs.
- Pro license unlocks dashboard.
- User cannot read another organization's leads.
- User cannot read another organization's price tables.
- User cannot read another organization's integrations.
- User cannot read public leads that have `organization_id = null`.
- Owner/admin can update organization settings.
- Viewer cannot update price tables.
- Viewer cannot read integration config.
- Audit logs are inserted by server-side code only.
- Service role key is never exposed to frontend.
- Frontend `?plan=pro` does not unlock Pro.
- Stripe webhook is required for production activation.

## 15. Recommended Next Step

Recommended next step:

```text
Continue polishing the schema and RLS policies before creating the Supabase project.
```

Reason:

- Tenant isolation is the most important SaaS security boundary.
- It is easier to adjust SQL before production data exists.
- Once schema and RLS are stable, create the Supabase project and run the migration.

After schema review:

1. Create Supabase project.
2. Run schema in SQL Editor.
3. Add a local dev `.env` only.
4. Build auth pages.
5. Build DB-backed dashboard entitlement.
