# JTDOS Public Lite Release Process

## 1. Create public-lite Branch From Private Main

```bash
git checkout main
git checkout -b public-lite
```

Do not delete private main. The private branch can keep real price tables and private integration work.

## 2. Delete / Exclude Real Price JSON

In the `public-lite` branch, remove:

```text
database/jtdos_hokkaido_price_real_v1.json
database/jtdos_tokyo_price_real_v1.json
database/jtdos_osaka_price_real_v1.json
database/base_prices_hokkaido_real_v1.json
```

The public repository must not include real prices, real supplier data, real JTDSS production configuration, real PayPal links, or real customer data.

## 3. Use Mock Price JSON

The public Lite branch should include only mock demo prices:

```text
database/mock_hokkaido_price_lite.json
database/mock_tokyo_price_lite.json
database/mock_osaka_price_lite.json
```

Each mock file must include:

```json
{
  "mock_data": true,
  "for_demo_only": true,
  "not_for_commercial_quote": true
}
```

## 4. Enable Lite Mode

Use:

```text
JTDOS_EDITION=lite
PUBLIC_LITE_MODE=true
JTDSS_USE_MOCK=true
```

In Lite mode, the quote engine must read mock price JSON only.

## 5. Run Safety Check

```bash
npm run check:public-lite
```

This must pass before pushing to a public repository.

## 6. Run Core Tests

```bash
node tests/ai_booking_e2e_alpha_0_1.test.js
node tests/quote_matrix_alpha_0_1.test.js
node tests/staging_smoke_alpha_0_1.test.js
node tests/public_lite_safety.test.js
```

## 7. Push to GitHub Public Repo

Push only after the safety check and tests pass.

## 8. Import Public Repo to Vercel

Import the public GitHub repository into Vercel.

Set:

```text
NODE_ENV=production
JTDOS_EDITION=lite
PUBLIC_LITE_MODE=true
JTDSS_USE_MOCK=true
USD_JPY_RATE=155
```

## 9. Bind Domain

Add:

```text
jtdos.com
```

Verify:

- `/`
- `/ai-booking`
- `/pricing`
- `/contact`

## 10. Release Rule

Every public release must rerun:

```bash
npm run check:public-lite
```

Do not publish if any safety check fails.
