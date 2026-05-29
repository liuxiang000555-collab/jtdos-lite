# JTDOS ALPHA 0.1 STAGING RUNBOOK

## 1. Pull Code

On the staging server:

```text
git pull
```

If deploying by archive, upload the latest project directory and confirm these folders exist:

- `backend`
- `frontend`
- `database`
- `tests`
- `docs`

## 2. Install Dependencies

Alpha 0.1 currently uses Node built-in modules only.

If future dependencies are added, run:

```text
npm install
```

## 3. Create `.env.staging`

Copy the template:

```text
cp .env.staging.example .env.staging
```

For first staging test, keep:

```text
NODE_ENV=staging
JTDSS_USE_MOCK=true
PORT=3000
```

Do not commit `.env.staging`.

## 4. Start Service

Load staging variables and start:

```text
set -a
. ./.env.staging
set +a
npm run start:staging
```

If `npm` is unavailable:

```text
set -a
. ./.env.staging
set +a
NODE_ENV=staging node backend/server.js
```

Or use the staging start helper:

```text
./scripts/start_staging.sh
```

## 4.1 VPS Systemd Setup

Recommended VPS path:

```text
/var/www/jtdos
```

Copy the service example:

```text
sudo cp deploy/systemd_jtdos_staging.service.example /etc/systemd/system/jtdos-staging.service
```

Edit the service if your project path or Node path is different:

```text
sudo nano /etc/systemd/system/jtdos-staging.service
```

Enable and start:

```text
sudo systemctl daemon-reload
sudo systemctl enable jtdos-staging
sudo systemctl start jtdos-staging
```

Check status and logs:

```text
sudo systemctl status jtdos-staging
sudo journalctl -u jtdos-staging -f
```

## 4.2 Nginx Setup

Copy the Nginx example:

```text
sudo cp deploy/nginx_jtdos_staging.conf.example /etc/nginx/sites-available/jtdos-staging
sudo ln -s /etc/nginx/sites-available/jtdos-staging /etc/nginx/sites-enabled/jtdos-staging
```

Edit domain and allowed IP:

```text
sudo nano /etc/nginx/sites-available/jtdos-staging
```

Test and reload:

```text
sudo nginx -t
sudo systemctl reload nginx
```

Use Certbot or platform HTTPS management for TLS.

## 5. Check `/health`

Open:

```text
https://staging.example.com/health
```

Expected:

```json
{
  "success": true,
  "service": "JTDOS Alpha 0.1",
  "environment": "staging",
  "jtdss_mode": "mock",
  "price_tables": {
    "hokkaido": true,
    "tokyo": true,
    "osaka": true
  }
}
```

## 6. Check `/internal/config-check`

Open from an allowed internal IP:

```text
https://staging.example.com/internal/config-check
```

This endpoint must show only booleans and must not expose secrets.

## 7. Visit `/ai-booking`

Open:

```text
https://staging.example.com/ai-booking
```

Confirm the page shows:

- Chat input
- Order summary
- Quote card
- Customer contact form
- Create Booking Request
- Send to JTDSS

## 8. Run Three Test Orders

### Tokyo

```text
We are 4 people arriving at Haneda Airport on June 1 at 14:30, flight JL000, going to Shinjuku with 4 suitcases. We prefer a Chinese-speaking driver.
```

Expected:

- Region = Tokyo
- Vehicle = Alphard/Vellfire
- Quote = fixed_price
- JTDSS mode = mock

### Osaka

```text
We are 6 people arriving at Kansai Airport on June 5 at 15:00, flight SQ000, going to Kyoto City with 6 suitcases.
```

Expected:

- Region = Osaka
- Vehicle = HiAce
- Quote = fixed_price
- JTDSS mode = mock

### Hokkaido Ski

```text
We are 4 people arriving at New Chitose Airport on January 10 at 13:00, flight NH000, going to Niseko with 4 suitcases and 2 ski bags.
```

Expected:

- Region = Hokkaido
- Vehicle = HiAce
- Operator review required
- JTDSS status = pending_operator_review

## 9. Check Mock JTDSS

Mock mode should return:

```text
jtdss_order_id=JTDSS-xxxxxx
```

Duplicate `jtdos_order_id` should return:

```text
DUPLICATE_ORDER
```

## 10. Check Notification Warnings

If Email or Telegram are not configured, order creation must still succeed.

Expected warning behavior:

- Email skipped warning
- Telegram skipped warning
- WhatsApp manual link generated when customer WhatsApp exists

## 11. Switch to Real JTDSS Client

Edit `.env.staging`:

```text
JTDSS_USE_MOCK=false
JTDSS_API_BASE_URL=https://your-jtdss-staging-domain.com
JTDSS_API_KEY=your-test-key
JTDSS_ORDER_ENDPOINT=/api/external/jtdos/orders
```

Restart service.

Check:

```text
/health
```

Expected:

```text
jtdss_mode = real
```

Run one Tokyo test order before testing special cases.

## 12. Roll Back to Mock Mode

Edit `.env.staging`:

```text
JTDSS_USE_MOCK=true
```

Restart service.

This allows AI booking and quote testing to continue even if the real JTDSS test endpoint is unavailable.

## 13. Common Errors

### `/health` returns price table false

Confirm the JSON files exist:

- `database/jtdos_hokkaido_price_real_v1.json`
- `database/jtdos_tokyo_price_real_v1.json`
- `database/jtdos_osaka_price_real_v1.json`

### `/internal/config-check` shows false

The related environment variable is missing from `.env.staging`.

### Real JTDSS request fails

Check:

- `JTDSS_API_BASE_URL`
- `JTDSS_API_KEY`
- `JTDSS_ORDER_ENDPOINT`
- Firewall / reverse proxy access
- JTDSS duplicate order response

### Notifications not sent

Check:

- Email provider config
- Telegram bot token
- Telegram chat ID

Notification failure must not block booking request creation.

### Secrets appear in logs

Stop deployment and verify:

```text
MASK_CUSTOMER_CONTACT_IN_LOGS=true
```

Also check reverse proxy and platform logs.
