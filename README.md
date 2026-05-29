# JTDOS Lite

AI Japan Travel Sales Assistant for private transfer, airport pickup, and charter service businesses.

## What is JTDOS Lite?

JTDOS Lite is the public demonstration version of JTDOS. It shows how an AI travel sales assistant can understand customer transportation needs, recommend a vehicle, estimate a price, and prepare a booking request for Japan travel services.

Lite is intended for evaluation, product demos, and developer review. It is not a production dispatch system.

JTDOS Lite uses mock data only. Public Lite deployments must use mock price tables, mock booking requests, and the mock operations backend.

## Features

- AI booking assistant
- Airport pickup / drop-off inquiry
- Point-to-point transfer inquiry
- Charter inquiry
- Multi-language input: English, Chinese, Spanish
- Vehicle recommendation
- Mock pricing
- Mock booking request
- Mock operations backend
- Landing / Pricing / Contact pages

## What Lite Does Not Include

JTDOS Lite does not include:

- Real Japan supplier network
- Real price tables
- Real JTDSS production connector
- Real payment integration
- Real customer data
- Private operator workflow

## Pro / Private

Commercial versions can include:

- Custom price table
- Private deployment
- Real notification integration
- Supplier workflow
- JTDSS connector
- API integration
- Commercial support

For Pro / Private discussions, use the Contact page in the demo or contact the JTDOS team.

## Local Development

```bash
npm run start:staging
```

Then open:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/ai-booking`
- `http://127.0.0.1:3000/pricing`
- `http://127.0.0.1:3000/contact`

Useful checks:

```bash
npm run test:staging
npm run check:public-lite
```

## Vercel Deployment

See [README_DEPLOY_VERCEL.md](README_DEPLOY_VERCEL.md).

Recommended Lite environment variables:

```text
NODE_ENV=production
JTDOS_EDITION=lite
PUBLIC_LITE_MODE=true
JTDSS_USE_MOCK=true
USD_JPY_RATE=155
```

## Security Notice

Do not commit `.env` files, API keys, payment links, real supplier data, real customer data, or production connector configuration.

Before publishing a public Lite repository, run:

```bash
npm run check:public-lite
```

The check must pass before pushing to a public GitHub repository.

## Contact

Open `/contact` in the Lite demo, or contact the JTDOS team for Pro / Private licensing.
