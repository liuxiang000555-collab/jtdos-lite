# JTDOS SUPABASE RLS TEST PLAN

## 1. Purpose

This document defines the manual RLS verification plan for the JTDOS Pro Cloud Supabase MVP.

The goal is to confirm that tenant isolation works before connecting the real JTDOS app.

Do not include Supabase URL, anon key, service role key, database password, or real customer data in this file.

## 2. Test Actors

| Actor | Description |
| --- | --- |
| `user_a@example.com` | Owner of Organization A |
| `user_b@example.com` | Owner of Organization B |
| Service role | Trusted server-side role only |
| Anonymous user | No authenticated session |

## 3. Test Data

Expected setup:

- User A has owner membership in Organization A.
- User B has owner membership in Organization B.
- Organization A has its own lead, license, price table, settings, and integration.
- Organization B has its own lead, license, price table, settings, and integration.
- One public lead exists with `organization_id = null`.

## 4. RLS Test Cases

| Test Case | Actor | Action | Expected Result | Pass / Fail | Notes |
| --- | --- | --- | --- | --- | --- |
| RLS-001 profile self read | User A | Read `profiles` where `id = user_a.id` | Allowed |  | User can read own profile. |
| RLS-002 profile cross read blocked | User A | Read `profiles` where `id = user_b.id` | Blocked / no rows |  | User cannot read another user profile. |
| RLS-003 profile self update | User A | Update own `profiles.name` | Allowed |  | `updated_at` should change. |
| RLS-004 organization own read | User A | Read Organization A | Allowed |  | Membership grants read access. |
| RLS-005 organization cross read blocked | User A | Read Organization B | Blocked / no rows |  | Tenant isolation. |
| RLS-006 organization owner update | User A | Update Organization A company metadata | Allowed |  | Owner/admin only. |
| RLS-007 organization cross update blocked | User A | Update Organization B | Blocked |  | Cross-tenant write denied. |
| RLS-008 membership self read | User A | Read own memberships | Allowed |  | User sees memberships they belong to. |
| RLS-009 membership org admin read | User A owner | Read Organization A memberships | Allowed |  | Owner/admin can manage members. |
| RLS-010 membership cross read blocked | User A | Read Organization B memberships | Blocked / no rows |  | No cross-org membership access. |
| RLS-011 lead own org read | User A | Read Organization A leads | Allowed |  | Organization lead visible. |
| RLS-012 lead cross org blocked | User A | Read Organization B leads | Blocked / no rows |  | Tenant isolation. |
| RLS-013 public lead blocked for normal user | User A | Read leads where `organization_id is null` | Blocked / no rows |  | Public leads are admin/server-side only. |
| RLS-014 public lead insert blocked for anon | Anonymous user | Insert lead directly into `public.leads` | Blocked |  | No direct anon insert policy. |
| RLS-015 public lead insert via service role | Service role | Insert lead with `organization_id = null` | Allowed |  | Must happen server-side only. |
| RLS-016 lead status update by operator/admin | User A owner/admin/operator | Update Organization A `lead_status` | Allowed |  | Owner/admin/operator roles allowed. |
| RLS-017 lead update blocked for viewer | User A viewer | Update Organization A `lead_status` | Blocked |  | Viewer should not update leads. |
| RLS-018 price table own org read | User A | Read Organization A price tables | Allowed |  | Members can read. |
| RLS-019 price table cross org blocked | User A | Read Organization B price tables | Blocked / no rows |  | Tenant isolation. |
| RLS-020 price table owner/admin write | User A owner/admin | Create/update Organization A price table | Allowed |  | Owner/admin write. |
| RLS-021 price table viewer write blocked | User A viewer | Update Organization A price table | Blocked |  | Viewer cannot modify. |
| RLS-022 integration owner/admin access | User A owner/admin | Read Organization A integrations | Allowed |  | Integrations are restricted to owner/admin. |
| RLS-023 integration viewer access blocked | User A viewer | Read Organization A integrations | Blocked / no rows |  | Config may reveal operational setup. |
| RLS-024 integration cross org blocked | User A | Read Organization B integrations | Blocked / no rows |  | Tenant isolation. |
| RLS-025 license read own org only | User A | Read Organization A licenses | Allowed |  | Members can read own org license. |
| RLS-026 license cross org blocked | User A | Read Organization B licenses | Blocked / no rows |  | Tenant isolation. |
| RLS-027 license client insert blocked | User A | Insert or update license directly | Blocked |  | License changes are service-role only. |
| RLS-028 organization settings member read | User A | Read Organization A settings | Allowed |  | Members can read. |
| RLS-029 organization settings owner/admin update | User A owner/admin | Update Organization A settings | Allowed |  | Owner/admin write. |
| RLS-030 organization settings viewer update blocked | User A viewer | Update Organization A settings | Blocked |  | Viewer cannot update settings. |
| RLS-031 audit log own org read | User A | Read Organization A audit logs | Allowed |  | Members can read own audit history. |
| RLS-032 audit log cross org blocked | User A | Read Organization B audit logs | Blocked / no rows |  | Tenant isolation. |
| RLS-033 audit log client insert blocked | User A | Insert audit log directly | Blocked |  | Audit logs inserted by backend/service role only. |

## 5. Minimum Acceptance Checklist

Before connecting the JTDOS app:

- [ ] User A cannot read Organization B.
- [ ] User B cannot read Organization A.
- [ ] Cross-organization leads are blocked.
- [ ] Cross-organization price tables are blocked.
- [ ] Public leads with `organization_id = null` are not visible to normal users.
- [ ] Direct anonymous lead insert is blocked.
- [ ] Service role can insert public lead.
- [ ] Client cannot insert/update license status.
- [ ] Client cannot insert audit logs.
- [ ] Viewer cannot read integrations.
- [ ] Viewer cannot update price tables or organization settings.

## 6. Notes for Running Tests

Recommended test order:

1. Run schema.
2. Create two test users.
3. Create profiles, organizations, and memberships.
4. Insert seed data using SQL Editor or service role.
5. Test as User A.
6. Test as User B.
7. Test anonymous behavior.
8. Test service role behavior from trusted server-side context only.

Do not use the service role key to simulate normal user behavior. Service role bypasses RLS and can hide policy errors.

## 7. Failure Handling

If a test fails:

1. Record the failed test case.
2. Record the actor, action, and unexpected result.
3. Check whether the issue is seed data, auth context, or RLS policy.
4. Do not disable RLS as a shortcut.
5. Fix the policy or setup, then rerun the affected tests.
