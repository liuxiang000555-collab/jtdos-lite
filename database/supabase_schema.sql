-- JTDOS Pro Cloud Supabase MVP Schema
-- Version: v0.2
-- This schema is a draft for Supabase SQL Editor.
-- Do not place real API keys or service role keys in this file.

create extension if not exists "pgcrypto";

-- Profiles are linked to Supabase auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  country text,
  company_type text,
  plan text not null default 'lite',
  plan_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_plan_check check (plan in ('lite', 'pro', 'private')),
  constraint organizations_plan_status_check check (plan_status in ('active', 'inactive', 'pending_payment', 'cancelled', 'manual_review'))
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  constraint memberships_role_check check (role in ('owner', 'admin', 'operator', 'viewer')),
  unique (user_id, organization_id)
);

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null,
  payment_provider text,
  payment_status text,
  license_status text not null default 'pending',
  billing_cycle text not null default 'one_time',
  price_usd integer,
  transaction_id text,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  paypal_transaction_id text,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint licenses_plan_check check (plan in ('lite', 'pro', 'private')),
  constraint licenses_payment_status_check check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'disputed', 'cancelled', 'manual')),
  constraint licenses_license_status_check check (license_status in ('pending', 'active', 'cancelled', 'expired', 'refunded', 'disputed')),
  constraint licenses_billing_cycle_check check (billing_cycle in ('one_time', 'monthly', 'yearly'))
);

-- Lead ownership strategy:
-- 1. Public website lead:
--    organization_id = null, source = public_contact, lead_status = new.
--    Insert must happen through trusted server-side API, not direct client insert.
-- 2. Logged-in Pro organization lead:
--    organization_id = current organization id, source = pro_booking_widget / pro_contact_form, lead_status = new.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text,
  company text,
  country text,
  email text,
  messenger text,
  interested_plan text,
  company_type text,
  estimated_monthly_inquiries text,
  message text,
  source text,
  lead_status text not null default 'new',
  lead_type text not null default 'pro_beta',
  assigned_to uuid references auth.users(id) on delete set null,
  last_contacted_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  constraint leads_status_check check (lead_status in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam')),
  constraint leads_type_check check (lead_type in ('pro_beta', 'private_license', 'booking_request', 'partnership', 'support'))
);

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  default_currency text not null default 'JPY',
  usd_jpy_rate numeric,
  default_timezone text not null default 'Asia/Tokyo',
  booking_language_default text not null default 'en',
  contact_email text,
  contact_whatsapp text,
  contact_line text,
  fast_track_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists public.price_tables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  region text,
  name text,
  status text not null default 'draft',
  version integer not null default 1,
  effective_from date,
  effective_to date,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_tables_status_check check (status in ('draft', 'active', 'archived'))
);

-- Integration config must store non-sensitive configuration only.
-- Do not store secret, token, API key, private key, or webhook secret in plaintext.
-- Future production should use encrypted storage or an external secret manager.
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  integration_status text not null default 'inactive',
  last_checked_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrations_status_check check (integration_status in ('inactive', 'active', 'error', 'disabled'))
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists organizations_owner_user_id_idx on public.organizations(owner_user_id);
create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists memberships_organization_id_idx on public.memberships(organization_id);
create index if not exists licenses_organization_id_idx on public.licenses(organization_id);
create index if not exists licenses_stripe_checkout_session_id_idx on public.licenses(stripe_checkout_session_id);
create index if not exists licenses_transaction_id_idx on public.licenses(transaction_id);
create index if not exists leads_organization_id_idx on public.leads(organization_id);
create index if not exists leads_lead_status_idx on public.leads(lead_status);
create index if not exists leads_lead_type_idx on public.leads(lead_type);
create index if not exists leads_assigned_to_idx on public.leads(assigned_to);
create index if not exists organization_settings_organization_id_idx on public.organization_settings(organization_id);
create index if not exists price_tables_organization_id_idx on public.price_tables(organization_id);
create index if not exists price_tables_status_idx on public.price_tables(status);
create index if not exists integrations_organization_id_idx on public.integrations(organization_id);
create index if not exists audit_logs_organization_id_idx on public.audit_logs(organization_id);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);

-- Shared updated_at trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists organization_settings_set_updated_at on public.organization_settings;
create trigger organization_settings_set_updated_at
before update on public.organization_settings
for each row execute function public.set_updated_at();

drop trigger if exists price_tables_set_updated_at on public.price_tables;
create trigger price_tables_set_updated_at
before update on public.price_tables
for each row execute function public.set_updated_at();

drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.licenses enable row level security;
alter table public.leads enable row level security;
alter table public.organization_settings enable row level security;
alter table public.price_tables enable row level security;
alter table public.integrations enable row level security;
alter table public.audit_logs enable row level security;

-- RLS helper functions.
-- These SECURITY DEFINER helpers avoid recursive policies on memberships.
-- They must not expose rows directly; they only return boolean authorization decisions.
create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(target_organization_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read own memberships" on public.memberships;
create policy "Users can read own memberships"
on public.memberships
for select
using (user_id = auth.uid());

drop policy if exists "Owners and admins can read organization memberships" on public.memberships;
create policy "Owners and admins can read organization memberships"
on public.memberships
for select
using (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Owners and admins can manage organization memberships" on public.memberships;
create policy "Owners and admins can manage organization memberships"
on public.memberships
for all
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations"
on public.organizations
for select
using (public.is_org_member(id));

drop policy if exists "Owners and admins can update their organizations" on public.organizations;
create policy "Owners and admins can update their organizations"
on public.organizations
for update
using (public.has_org_role(id, array['owner', 'admin']))
with check (public.has_org_role(id, array['owner', 'admin']));

drop policy if exists "Members can read organization licenses" on public.licenses;
create policy "Members can read organization licenses"
on public.licenses
for select
using (public.is_org_member(organization_id));

drop policy if exists "Members can read organization leads" on public.leads;
create policy "Members can read organization leads"
on public.leads
for select
using (
  organization_id is not null
  and public.is_org_member(organization_id)
);

drop policy if exists "Operators can update lead status and notes" on public.leads;
create policy "Operators can update lead status and notes"
on public.leads
for update
using (
  organization_id is not null
  and public.has_org_role(organization_id, array['owner', 'admin', 'operator'])
)
with check (
  organization_id is not null
  and public.has_org_role(organization_id, array['owner', 'admin', 'operator'])
);

-- Public website lead insert should be done by trusted server-side API with service role.
-- Do not add direct anonymous insert policy for public.leads in production unless abuse controls are added.

drop policy if exists "Members can read organization settings" on public.organization_settings;
create policy "Members can read organization settings"
on public.organization_settings
for select
using (public.is_org_member(organization_id));

drop policy if exists "Owners and admins can update organization settings" on public.organization_settings;
create policy "Owners and admins can update organization settings"
on public.organization_settings
for update
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read organization price tables" on public.price_tables;
create policy "Members can read organization price tables"
on public.price_tables
for select
using (public.is_org_member(organization_id));

drop policy if exists "Owners and admins can manage organization price tables" on public.price_tables;
create policy "Owners and admins can manage organization price tables"
on public.price_tables
for all
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

-- Integration config should only contain non-sensitive settings.
-- Owner/admin access is required because config may reveal operational setup details.
drop policy if exists "Owners and admins can read organization integrations" on public.integrations;
create policy "Owners and admins can read organization integrations"
on public.integrations
for select
using (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Owners and admins can manage organization integrations" on public.integrations;
create policy "Owners and admins can manage organization integrations"
on public.integrations
for all
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read organization audit logs" on public.audit_logs;
create policy "Members can read organization audit logs"
on public.audit_logs
for select
using (
  organization_id is not null
  and public.is_org_member(organization_id)
);

-- Audit log insert should be done by trusted server-side API with service role.
-- This prevents clients from forging audit history.

-- Service-role-only operations should be handled by trusted backend code:
-- - Creating organizations at signup
-- - Creating owner memberships
-- - Inserting public Contact leads without authenticated organization_id
-- - Inserting licenses after Stripe webhook verification
-- - Updating organization plan after verified payment
-- - Inserting audit logs for Pro activation, price table edits, integration edits, lead status changes,
--   license status changes, payment webhook events, and JTDSS connector setting changes
