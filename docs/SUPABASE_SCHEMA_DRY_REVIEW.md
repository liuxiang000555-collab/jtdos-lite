# JTDOS SUPABASE SCHEMA DRY REVIEW

## 1. Review Summary

This dry review checks the JTDOS Pro Cloud Supabase MVP schema before creating a real Supabase project.

Reviewed files:

- `database/supabase_schema.sql`
- `docs/SUPABASE_MVP_IMPLEMENTATION_PLAN.md`
- `database/SCHEMA_CHANGELOG.md`

Result:

The schema is suitable to move into a first Supabase project creation phase after one more manual review in the Supabase SQL Editor.

No real Supabase project was connected. No SQL was executed. No secrets or API keys were added.

## 2. Blocking Issues

No remaining blocking issue was found after this dry review.

Issues found and corrected:

- `updated_at` columns existed but did not have update triggers.
- Membership-related RLS policies had potential recursive self-reference risk.

Corrections applied:

- Added `public.set_updated_at()` trigger function.
- Added `updated_at` triggers for mutable tables.
- Added `public.is_org_member()` and `public.has_org_role()` helper functions.
- Reworked RLS policies to use helper functions instead of recursive membership queries.

## 3. Non-Blocking Issues

The following items are acceptable for MVP but should be handled carefully during implementation:

- Public Contact leads have `organization_id = null`; they must be inserted only by server-side API using service role credentials.
- `integrations.config` can reveal operational setup, so only owner/admin can read or write it.
- Integration secrets must not be stored in plaintext.
- First organization and owner membership creation still needs an implementation pattern: server route, database trigger, or admin flow.
- License activation must remain service-role-only and must not trust frontend success redirects.

## 4. Recommended Schema Changes Applied

Applied to `database/supabase_schema.sql`:

- `create extension if not exists "pgcrypto";`
- shared `updated_at` trigger function
- table-specific `updated_at` triggers
- RLS helper functions:
  - `public.is_org_member(target_organization_id uuid)`
  - `public.has_org_role(target_organization_id uuid, allowed_roles text[])`
- owner/admin membership management policy
- server-side-only comments for public lead insert, payment/license changes, and audit log insert

## 5. SQL Executability Review

### UUID Generation

`gen_random_uuid()` is used and `pgcrypto` is explicitly enabled:

```sql
create extension if not exists "pgcrypto";
```

### Foreign Key Order

Table creation order is valid:

1. `profiles` references `auth.users(id)`
2. `organizations` references `auth.users(id)`
3. `memberships` references `auth.users(id)` and `organizations`
4. `licenses` references `organizations`
5. `leads` references `organizations` and `auth.users`
6. `organization_settings` references `organizations`
7. `price_tables` references `organizations` and `auth.users`
8. `integrations` references `organizations`
9. `audit_logs` references `organizations` and `auth.users`

### Timestamp Defaults

`created_at` and `updated_at` defaults are consistent:

```sql
timestamptz not null default now()
```

### Updated At Triggers

Triggers are now defined for mutable tables:

- `profiles`
- `organizations`
- `organization_settings`
- `price_tables`
- `integrations`

### Status Constraints

Text status fields have check constraints:

- `organizations.plan`
- `organizations.plan_status`
- `memberships.role`
- `licenses.plan`
- `licenses.payment_status`
- `licenses.license_status`
- `licenses.billing_cycle`
- `leads.lead_status`
- `leads.lead_type`
- `price_tables.status`
- `integrations.integration_status`

### JSONB Defaults

JSONB defaults are valid:

```sql
default '{}'::jsonb
```

## 6. RLS Risk Review

### Public Leads

Correct rule:

- No anonymous insert policy is created for `public.leads`.
- Public website leads must be inserted through server-side API using service role credentials.
- Public leads with `organization_id = null` are not readable by ordinary organization users.

Risk if changed later:

Opening direct anon insert would require rate limits, captcha or turnstile, abuse monitoring, and strict validation.

### Profiles

Users can only read and update their own profile.

### Organizations

Users can read organizations where they are members.

Only owner/admin can update organization records.

### Memberships

Users can read their own memberships.

Owner/admin can read and manage organization memberships.

Initial owner membership creation should be handled by trusted server-side code or a controlled signup trigger.

### Licenses

Organization members can read organization licenses.

No client insert/update policy is defined. License creation and status updates should be service-role-only after verified Stripe webhook, PayPal confirmation, or manual admin action.

### Leads

Organization members can read their own organization leads.

Owner/admin/operator can update lead status and notes.

Public leads are not exposed to ordinary organization users.

### Price Tables

Organization members can read price tables.

Owner/admin can create, update, archive, and manage price tables.

Viewer cannot modify price tables.

### Integrations

Only owner/admin can read or manage integrations.

This is intentionally stricter than ordinary member read access because `config` may expose operational setup details.

Secrets must not be stored in plaintext.

### Audit Logs

Organization members can read their own organization audit logs.

Clients do not get insert policy. Audit logs should be inserted by trusted backend/service role code.

## 7. Pro Cloud MVP Coverage

The schema supports:

- user registration through Supabase Auth
- profile creation
- organization creation
- owner membership
- default Lite plan
- Pro license activation
- server-side dashboard entitlement checks
- public Contact lead storage
- Pro organization lead storage
- price table configuration
- integration configuration
- audit log history
- future Stripe webhook activation

## 8. Recommendation

Recommendation: proceed to Supabase project creation after reviewing this schema once in the Supabase SQL Editor.

Suggested next steps:

1. Create a Supabase project.
2. Paste and run `database/supabase_schema.sql` in SQL Editor.
3. Confirm tables, indexes, functions, triggers, and RLS policies were created.
4. Create a test user.
5. Create a Lite organization and owner membership through trusted server-side code.
6. Verify RLS with two test users from different organizations.

## 9. Remaining Risks

- Need to decide signup bootstrap strategy: backend route vs database trigger.
- Need to confirm helper functions run with the correct owner privileges in Supabase.
- Need future encrypted secret handling for integrations.
- Need server-side entitlement helper before any Pro API is exposed.
- Need Stripe webhook signature verification before production Pro activation.
- Need admin-only workflow for public leads with `organization_id = null`.
