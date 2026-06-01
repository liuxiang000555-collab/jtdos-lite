# JTDOS AUTH AND TENANT ARCHITECTURE

## 1. Purpose

This document defines the real account, organization, permission, and tenant architecture for JTDOS Pro Cloud.

This is a design document only. It does not connect a real database, auth provider, payment provider, or production JTDSS connector.

## 2. Why Pro Cloud Needs an Account System

JTDOS Lite can be public because it uses mock data and does not store real customer workflows.

JTDOS Pro Cloud needs accounts because Pro users will manage real business configuration:

- Company-specific price tables
- Lead storage settings
- Email / Telegram / Google Sheet notification settings
- AI Booking Pro mode
- JTDSS connector configuration
- Customer lead records
- Team member access
- Billing and license status

Without a real account and tenant system, JTDOS cannot safely separate one operator's data from another operator's data.

Core requirement:

```text
Every Pro configuration must belong to one organization / tenant, and every Pro API must verify the authenticated user's membership and permission.
```

## 3. User Model

The user model represents one login identity.

```json
{
  "user_id": "usr_001",
  "email": "owner@example.com",
  "name": "Operator Owner",
  "password_hash": "",
  "auth_provider": "email_password",
  "role": "user",
  "created_at": "2026-06-01T00:00:00Z",
  "updated_at": "2026-06-01T00:00:00Z"
}
```

Fields:

- `user_id`: Stable internal user identifier.
- `email`: Login email and primary account identifier.
- `name`: User display name.
- `password_hash`: Stored only if using email + password auth.
- `auth_provider`: `email_password`, `magic_link`, `google`, `clerk`, `authjs`, or `supabase`.
- `role`: Global system role, usually `user`; future values may include `support_admin`.
- `created_at`: User creation time.
- `updated_at`: Last user update time.

Important:

The user's global `role` should not be used alone to unlock Pro features. Pro access should be based on organization membership and license status.

## 4. Organization / Tenant Model

The organization model represents one customer workspace.

```json
{
  "organization_id": "org_001",
  "owner_user_id": "usr_001",
  "company_name": "Example Travel",
  "country": "Japan",
  "company_type": "Travel Agency",
  "plan": "lite",
  "plan_status": "active",
  "created_at": "2026-06-01T00:00:00Z"
}
```

Fields:

- `organization_id`: Stable tenant identifier.
- `owner_user_id`: User who owns the tenant.
- `company_name`: Company or brand name.
- `country`: Company country.
- `company_type`: Travel Agency, Transfer Operator, Local Supplier, OTA, Influencer / Creator, Developer, or Other.
- `plan`: `lite`, `pro`, or `private`.
- `plan_status`: `active`, `inactive`, `pending_payment`, `cancelled`, or `manual_review`.
- `created_at`: Tenant creation time.

Tenant rule:

```text
All Pro resources must include organization_id.
```

Examples:

- Price tables
- Leads
- Notification settings
- Google Sheet settings
- JTDSS connector settings
- AI Booking widget settings

## 5. Membership Model

Membership connects users to organizations and defines their tenant-level permissions.

```json
{
  "user_id": "usr_001",
  "organization_id": "org_001",
  "role": "owner"
}
```

Roles:

- `owner`: Full control, billing, team management, integrations, and configuration.
- `admin`: Can manage configuration and users, but may not own billing.
- `operator`: Can view and handle leads/orders, but cannot manage billing.
- `viewer`: Read-only access.

Recommended permission matrix:

| Capability | owner | admin | operator | viewer |
| --- | --- | --- | --- | --- |
| View dashboard | yes | yes | yes | yes |
| Edit price tables | yes | yes | no | no |
| Edit integrations | yes | yes | no | no |
| View leads | yes | yes | yes | yes |
| Export leads | yes | yes | optional | no |
| Manage billing | yes | no | no | no |
| Manage members | yes | yes | no | no |

## 6. License Model

The license model records commercial entitlement.

```json
{
  "license_id": "lic_001",
  "organization_id": "org_001",
  "plan": "pro",
  "payment_status": "paid",
  "activated_at": "2026-06-01T00:00:00Z",
  "expires_at": "",
  "source": "stripe"
}
```

Fields:

- `license_id`: License record identifier.
- `organization_id`: Tenant receiving entitlement.
- `plan`: `lite`, `pro`, or `private`.
- `payment_status`: `pending`, `paid`, `failed`, `refunded`, `disputed`, or `cancelled`.
- `activated_at`: Time access was activated.
- `expires_at`: Expiration date, if applicable.
- `source`: `manual`, `stripe`, or `paypal`.

License rule:

```text
Pro access requires organization.plan = pro and an active paid or manually approved license.
```

## 7. Pro Dashboard Permissions

### Lite

Lite organizations:

- Can only view demo pages.
- Cannot configure real price tables.
- Cannot configure real integrations.
- Cannot export real leads.
- Cannot access production JTDSS connector settings.

### Pro

Pro organizations:

- Can configure price tables.
- Can configure lead storage.
- Can configure Email / Telegram notification.
- Can enter Pro dashboard.
- Can view leads.
- Can export leads.
- Can configure AI Booking Pro mode.

### Private

Private organizations:

- Receive private deployment.
- May receive API / JTDSS connector.
- May receive source license.
- Require manual delivery and approval.
- Must not receive automatic source download from the public app.

## 8. Session / Auth Options

### Email + Password

Pros:

- Familiar login method.
- Works for most business users.
- Easy to understand.

Cons:

- Password reset, hashing, lockout, and security policies must be implemented correctly.
- Higher security responsibility if built in-house.

### Magic Link

Pros:

- No password storage.
- Lower friction.
- Good for B2B operators who use email regularly.

Cons:

- Depends on reliable email delivery.
- Less convenient for shared operation terminals.

### Google OAuth

Pros:

- Strong account security.
- Good for agencies using Google Workspace.
- Reduces password management.

Cons:

- Not all customers use Google.
- Some companies prefer email/password accounts.

### Clerk / Auth.js / Supabase Auth

Pros:

- Faster implementation.
- Handles common auth flows.
- Supports OAuth, magic link, sessions, and user management.
- Reduces risk compared to writing auth from scratch.

Cons:

- Adds provider dependency.
- Pricing and limits must be checked.
- Tenant/organization logic may still require custom implementation.

## 9. Recommended First Stage

Recommended first stage:

```text
Use managed auth or a proven auth framework.
```

Best options:

1. Clerk for fastest B2B SaaS-style launch.
2. Supabase Auth if using Supabase database.
3. Auth.js if moving to a full Next.js app.
4. Email + password only if using a mature backend framework and secure password handling.

Avoid building complex authentication from scratch during Pro Beta.

Recommended first-stage scope:

- Email login or magic link
- One organization per user at signup
- Owner role only
- Stripe webhook activates organization plan
- Pro dashboard checks server-side organization plan
- Add team members later

## 10. Security Rules

Mandatory rules:

- Do not trust frontend plan state.
- Do not unlock Pro from localStorage or query params.
- Server must check `user.plan` and `organization.plan`.
- Server must check active license status.
- All Pro APIs require authentication.
- All Pro APIs require organization membership.
- Every Pro resource must include `organization_id`.
- Users cannot access another organization's price tables, leads, or integrations.
- Private source code must not be downloaded through the public app.
- Payment webhook activation must be server-side.
- API keys must stay in server environment variables only.
- Logs must mask customer email, WhatsApp, LINE, and other sensitive contact fields.

Example Pro API check:

```text
1. Verify session.
2. Load user.
3. Load organization membership.
4. Verify organization plan is pro or private.
5. Verify license is active.
6. Verify role permission.
7. Execute action.
```

## 11. Next Implementation Plan

Phase 1: Auth foundation

- Choose auth provider.
- Add sign up / login / logout.
- Create user record.
- Create organization record at signup.
- Create owner membership.

Phase 2: Billing connection

- Add Stripe Checkout.
- Add payment webhook verification.
- Create license record after verified payment.
- Activate organization plan.

Phase 3: Pro dashboard server protection

- Protect dashboard routes.
- Protect Pro APIs.
- Replace mock localStorage plan with server-side entitlement.
- Show Lite upgrade screen for non-Pro organizations.

Phase 4: Tenant resources

- Store price tables by organization.
- Store lead storage settings by organization.
- Store notification settings by organization.
- Store JTDSS connector settings by organization.

Phase 5: Team permissions

- Invite members.
- Add admin / operator / viewer roles.
- Add audit logs.

Phase 6: Private workflow

- Add manual Private request status.
- Add internal admin approval.
- Keep source delivery outside public checkout.

## 12. Summary

JTDOS Pro Cloud should be a tenant-based SaaS product:

- Users log in.
- Organizations own business configuration.
- Membership controls team access.
- Licenses control commercial entitlement.
- Server-side checks protect every Pro API.

The first implementation should use managed auth or a proven framework, then connect Stripe webhook-based activation for Pro Cloud. Private Source License remains manual and must never be automatically downloaded from the public app.
