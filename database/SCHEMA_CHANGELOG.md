# JTDOS SUPABASE SCHEMA CHANGELOG

## v0.1 Initial Schema

Initial Supabase MVP schema draft.

Added tables:

- `profiles`
- `organizations`
- `memberships`
- `licenses`
- `leads`
- `price_tables`
- `integrations`

Initial RLS draft:

- Users can read their own profile.
- Users can read their own memberships.
- Organization members can read their organizations.
- Organization members can read organization licenses, leads, price tables, and integrations.
- Owner/admin can update organizations.
- Owner/admin can manage price tables and integrations.

## v0.2 Lead Status / Organization Settings / Audit Logs / Billing Fields

Lead improvements:

- Added `lead_status`
- Added `lead_type`
- Added `assigned_to`
- Added `last_contacted_at`
- Added `internal_notes`
- Clarified public website lead strategy:
  - `organization_id = null`
  - `source = public_contact`
  - `lead_status = new`
- Clarified logged-in Pro organization lead strategy:
  - `organization_id = current organization id`
  - `source = pro_booking_widget / pro_contact_form`
  - `lead_status = new`

New tables:

- `organization_settings`
- `audit_logs`

Price table improvements:

- Added `status`
- Added `version`
- Added `effective_from`
- Added `effective_to`
- Added `created_by`
- Added `updated_by`

Integration improvements:

- Added `integration_status`
- Added `last_checked_at`
- Added `error_message`
- Documented that `config` stores non-sensitive configuration only.
- Documented that secrets must use encrypted storage or external secret manager in production.

License / billing improvements:

- Added `license_status`
- Added `billing_cycle`
- Added `stripe_customer_id`
- Added `stripe_checkout_session_id`
- Added `stripe_subscription_id`
- Added `paypal_transaction_id`

RLS updates:

- `organization_settings`: organization members can read, owner/admin can update.
- `audit_logs`: organization members can read, trusted server/service role inserts.
- `leads`: organization members can read organization leads. Public lead insert is server-side only.
- `price_tables`: members read, owner/admin write.
- `integrations`: owner/admin read/write because config may reveal operational setup.

## v0.3 Supabase Schema Dry Review Fixes

SQL executable-readiness updates:

- Confirmed `pgcrypto` extension is required for `gen_random_uuid()`.
- Added shared `public.set_updated_at()` trigger function.
- Added `updated_at` triggers for:
  - `profiles`
  - `organizations`
  - `organization_settings`
  - `price_tables`
  - `integrations`

RLS safety updates:

- Added `public.is_org_member(organization_id)` helper.
- Added `public.has_org_role(organization_id, roles)` helper.
- Replaced recursive membership policy checks with helper-function based policies.
- Clarified public Contact lead insert must happen through trusted server-side API with service role credentials.
- Kept public leads with `organization_id = null` unreadable by ordinary organization users.

Remaining implementation notes:

- First organization and owner membership creation should be handled by trusted server-side code or a controlled signup trigger.
- License/payment status changes should only happen after verified webhook or manual admin action.
- Integration secrets must not be stored in plaintext `integrations.config`.
