# JTDOS + JTDSS Brand System

## 1. Brand Architecture

### JTDOS

JTDOS is the AI Japan Travel Sales Assistant.

It is customer-facing and built for travelers, travel agencies, overseas agents, and potential Pro / Private buyers.

Brand personality:

- Friendly
- Intelligent
- Consultative
- Sales-oriented

### JTDSS

JTDSS is the Japan Travel Driver Service System / Dispatch Execution System.

It is operator-facing and built for drivers, vehicle companies, operations teams, and dispatch staff.

Brand personality:

- Reliable
- Operational
- Structured
- Trustworthy

## 2. Shared Design Tokens

### Font

```text
Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

### Layout

- Landing pages max-width: 1120px
- Dashboard pages max-width: 1200px

### Spacing

- Section padding: 72px desktop / 40px mobile
- Card padding: 24px-32px
- Gap: 16px / 24px / 32px

### Border Radius

- Small: 10px
- Medium: 16px
- Large: 24px

### Card

- Background: white
- Border: 1px solid token border color
- Box shadow: `0 18px 45px rgba(15, 23, 42, 0.06)`

### Button

- Height: 48px
- Border radius: 12px
- Font weight: 700

### Input

- Height: 48px
- Border radius: 12px
- Border: 1px solid token border color
- Focus ring uses product primary color

## 3. JTDOS Color Palette

- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Text: `#0F172A`
- Muted text: `#64748B`
- Primary: `#2563EB`
- Primary hover: `#1D4ED8`
- Primary soft: `#E0F2FE`
- Border: `#E2E8F0`
- Success: `#10B981`
- Warning: `#F59E0B`

## 4. JTDSS Color Palette

- Background: `#F7FAF8`
- Surface: `#FFFFFF`
- Text: `#10231B`
- Muted text: `#66756E`
- Primary: `#1F7A5C`
- Primary hover: `#166348`
- Primary soft: `#E8F5EF`
- Border: `#DCE8E2`
- Warning: `#F59E0B`

## 5. UI Personality Rules

### JTDOS

- Larger hero title
- More whitespace
- Blue CTA
- Friendly AI assistant tone
- Customer-facing language
- No internal dispatch terms

### JTDSS

- More structured grid
- Green CTA
- Clear operational trust
- Login / dispatch / driver tools
- Professional and stable

## 6. Shared Components

### Button

Primary actions use the product primary color, 48px height, 12px radius, and 700 font weight.

### Card

Cards use white surfaces, medium or large radius, the product border color, and the shared soft shadow.

### Input

Inputs use the shared border, 12px radius, and product-colored focus ring.

### Badge

Badges use soft background colors and compact 10px radius.

### Alert

Alerts use product soft colors with a clear text hierarchy and no alarming copy unless action is required.

### Summary Panel

Summary panels translate structured data into customer-readable labels and avoid internal field names.

### Pricing Card

Pricing cards show price, vehicle, included items, excluded items, deposit, cancellation policy, and confirmation notes.

### Contact Form

Contact forms are B2B-friendly, concise, and should explain what happens after submission.

### Login Card

Login cards should be calm, secure, and operational. They should support standard login, registration, and provider-assisted registration without changing auth logic.
