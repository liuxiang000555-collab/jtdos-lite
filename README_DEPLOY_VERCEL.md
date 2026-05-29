# Deploy JTDOS Lite to Vercel

## 1. Fork / Clone Repository

Fork or clone the public JTDOS Lite repository.

## 2. Import to Vercel

Create a new Vercel project and import the repository.

## 3. Set Environment Variables

Set:

```text
NODE_ENV=production
JTDOS_EDITION=lite
PUBLIC_LITE_MODE=true
JTDSS_USE_MOCK=true
USD_JPY_RATE=155
```

Lite deployment should use mock mode.

## 4. Deploy

Deploy from the Vercel dashboard or CLI.

## 5. Add Custom Domain

Add your custom domain, for example:

```text
jtdos.com
```

## 6. Verify Pages

After deployment, verify:

- `/`
- `/ai-booking`
- `/pricing`
- `/contact`

## 7. Security Check

Before importing or deploying a public repo, run:

```bash
npm run check:public-lite
```

Do not deploy a public Lite repository if the check reports real price tables, secrets, payment links, or production connector configuration.
