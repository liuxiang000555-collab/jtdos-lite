# JTDOS SUPABASE PROJECT SETUP GUIDE

## 1. Purpose

This guide describes how to create the first real Supabase project for JTDOS Pro Cloud and verify that the MVP schema, RLS policies, and tenant isolation rules work correctly.

This guide does not include real Supabase keys. Do not paste Supabase URL, anon key, service role key, or private credentials into GitHub, public docs, chat, frontend code, logs, or screenshots.

## 2. Create Supabase Project

1. Open Supabase.
2. Create a new project.
3. Choose a project name such as:

```text
jtdos-pro-cloud-mvp
```

4. Choose the closest region for expected users.
5. Save the database password in a private password manager.
6. Wait until the project is ready.

## 3. Run Schema SQL

1. Open Supabase project.
2. Go to SQL Editor.
3. Open local file:

```text
database/supabase_schema.sql
```

4. Paste the full SQL into the SQL Editor.
5. Run the script.

Expected result:

- No SQL error.
- `pgcrypto` extension is enabled.
- Tables are created.
- Indexes are created.
- RLS is enabled.
- RLS helper functions are created.
- `updated_at` triggers are created.

## 4. Check Tables

Go to Table Editor and confirm these tables exist:

- `profiles`
- `organizations`
- `memberships`
- `licenses`
- `leads`
- `organization_settings`
- `price_tables`
- `integrations`
- `audit_logs`

## 5. Check RLS Is Enabled

For each table, confirm RLS is enabled:

- `profiles`
- `organizations`
- `memberships`
- `licenses`
- `leads`
- `organization_settings`
- `price_tables`
- `integrations`
- `audit_logs`

Important:

Do not disable RLS to make tests pass. If a test fails, fix the policy or test setup.

## 6. Create Two Test Users

Create test users in Supabase Auth:

```text
user_a@example.com
user_b@example.com
```

Use temporary test passwords. Do not reuse production passwords.

After creating users, copy their `auth.users.id` values privately for setup SQL. Do not commit these IDs if they belong to a real project.

## 7. Create Profiles

For each test user, create a profile row.

Example shape:

```sql
insert into public.profiles (id, email, name)
values
  ('USER_A_UUID', 'user_a@example.com', 'User A'),
  ('USER_B_UUID', 'user_b@example.com', 'User B');
```

Replace `USER_A_UUID` and `USER_B_UUID` with the actual Auth user IDs.

## 8. Create Organization A and B

Create one organization for each user:

```sql
insert into public.organizations (
  id,
  owner_user_id,
  company_name,
  country,
  company_type,
  plan,
  plan_status
)
values
  ('ORG_A_UUID', 'USER_A_UUID', 'Organization A', 'Japan', 'Travel Agency', 'lite', 'active'),
  ('ORG_B_UUID', 'USER_B_UUID', 'Organization B', 'Singapore', 'Transfer Operator', 'lite', 'active');
```

Use generated UUIDs for `ORG_A_UUID` and `ORG_B_UUID`.

## 9. Create Owner Memberships

Create owner membership for each organization:

```sql
insert into public.memberships (user_id, organization_id, role)
values
  ('USER_A_UUID', 'ORG_A_UUID', 'owner'),
  ('USER_B_UUID', 'ORG_B_UUID', 'owner');
```

## 10. Insert Test Data

### Test Licenses

```sql
insert into public.licenses (
  organization_id,
  plan,
  payment_provider,
  payment_status,
  license_status,
  billing_cycle,
  price_usd
)
values
  ('ORG_A_UUID', 'pro', 'manual', 'manual', 'active', 'one_time', 999),
  ('ORG_B_UUID', 'lite', 'manual', 'manual', 'pending', 'one_time', 0);
```

### Test Leads

```sql
insert into public.leads (
  organization_id,
  name,
  company,
  email,
  source,
  lead_status,
  lead_type
)
values
  ('ORG_A_UUID', 'Lead A', 'Agency A', 'lead-a@example.com', 'pro_booking_widget', 'new', 'booking_request'),
  ('ORG_B_UUID', 'Lead B', 'Agency B', 'lead-b@example.com', 'pro_booking_widget', 'new', 'booking_request'),
  (null, 'Public Lead', 'Public Company', 'public-lead@example.com', 'public_contact', 'new', 'pro_beta');
```

Public lead rule:

- `organization_id = null`
- source = `public_contact`
- insert must be done by server-side API with service role in production
- ordinary users must not read this row

### Test Price Tables

```sql
insert into public.price_tables (
  organization_id,
  region,
  name,
  status,
  version,
  data
)
values
  ('ORG_A_UUID', 'Tokyo', 'Org A Tokyo Prices', 'active', 1, '{"mock": true}'::jsonb),
  ('ORG_B_UUID', 'Osaka', 'Org B Osaka Prices', 'active', 1, '{"mock": true}'::jsonb);
```

### Test Integrations

```sql
insert into public.integrations (
  organization_id,
  provider,
  config,
  enabled,
  integration_status
)
values
  ('ORG_A_UUID', 'email', '{"from_name": "Org A"}'::jsonb, true, 'active'),
  ('ORG_B_UUID', 'telegram', '{"chat_label": "Org B Ops"}'::jsonb, false, 'inactive');
```

Do not store API keys or tokens in `integrations.config`.

## 11. Verify Tenant Isolation

Run tests from the Supabase client or SQL with JWT/auth context.

### User A Must Not Read User B Organization

As `user_a@example.com`:

Expected:

- Can read Organization A.
- Cannot read Organization B.

### User A Must Not Read User B Leads

As `user_a@example.com`:

Expected:

- Can read Lead A.
- Cannot read Lead B.

### User A Must Not Read User B Price Tables

As `user_a@example.com`:

Expected:

- Can read Org A Tokyo Prices.
- Cannot read Org B Osaka Prices.

### Normal User Must Not Read Public Leads

As `user_a@example.com` or `user_b@example.com`:

Expected:

- Cannot read public leads where `organization_id is null`.

### Service Role Can Insert Public Lead

Using server-side service role only:

Expected:

- Can insert a public lead with `organization_id = null`.
- Ordinary users still cannot read it.

## 12. Common Errors

### RLS Policy Recursion

Symptom:

```text
infinite recursion detected in policy for relation memberships
```

Cause:

Policy directly queries `memberships` from a `memberships` policy.

Expected fix:

Use helper functions such as:

- `public.is_org_member(...)`
- `public.has_org_role(...)`

### auth.users Reference Error

Symptom:

Foreign key or relation error involving `auth.users`.

Checks:

- Make sure the SQL runs inside Supabase, not a plain local Postgres database.
- Make sure Auth schema exists.
- Make sure user IDs match real `auth.users.id` values.

### Service Role Key Used Incorrectly

Risk:

Service role bypasses RLS. It must never run in browser JavaScript.

Rules:

- Use service role only in trusted server-side routes.
- Do not log it.
- Do not return it in API responses.
- Do not put it in public GitHub.

### SQL Function Permission Issues

Symptom:

RLS helper function does not behave as expected.

Checks:

- Confirm helper functions exist.
- Confirm they are `security definer`.
- Confirm `set search_path = public`.
- Confirm policies call the helper functions.

### Private Key / Service Key Leakage Risk

Never expose:

- `SUPABASE_SERVICE_ROLE_KEY`
- database password
- Stripe secret key
- PayPal secret
- integration tokens
- JTDSS API key

## 13. Acceptance Criteria

Supabase setup is ready for app integration only when:

- schema runs successfully
- RLS is enabled on all MVP tables
- user A and user B cannot read each other's tenant data
- public leads cannot be read by normal users
- service role can insert public leads
- owner/admin can update tenant settings
- viewer cannot modify price tables or integrations
- no secrets are present in frontend code or GitHub

## 14. Next Step After Setup

After manual verification:

1. Add Supabase environment variables to Vercel.
2. Add server-side Supabase client using service role only in backend routes.
3. Add frontend Supabase client with anon key only after RLS is verified.
4. Implement signup bootstrap for profile, organization, and owner membership.
5. Add server-side entitlement checks before Pro APIs.
