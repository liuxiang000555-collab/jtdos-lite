# JTDOS DO NOT TOUCH

Codex must not modify the following without explicit user approval:

1. Real price table JSON files
2. `.env`, API keys, tokens, or secrets
3. PayPal payment links
4. JTDSS production connector configuration
5. Real customer data
6. Production deployment configuration
7. Passing core test assertions
8. Test files by deleting or weakening business coverage
9. Business rule files by removing real operator rules
10. Private logic inside the public Lite version

## Protected Real Price Tables

Do not modify without explicit user approval:

- `database/jtdos_hokkaido_price_real_v1.json`
- `database/jtdos_tokyo_price_real_v1.json`
- `database/jtdos_osaka_price_real_v1.json`

## Protected Runtime Secrets

Do not write, print, commit, or hardcode:

- JTDSS API keys
- Email API keys
- Telegram bot tokens
- PayPal payment links
- Real customer phone numbers, emails, WhatsApp, LINE, or names

## Lite Boundary

The Lite version must remain demo-safe.

Lite must not include:

- Real JTDSS production credentials
- Real PayPal payment links
- Real private operator data
- Real customer data
- Private-only business logic intended for Pro / Private builds

## Testing Boundary

Do not:

- Delete core tests
- Skip required tests
- Lower assertions to hide a product problem
- Treat a failing test as acceptable without explicit user approval

If a test fails, fix the implementation or update the test only when the business rule has explicitly changed.
