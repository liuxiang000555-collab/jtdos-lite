#!/usr/bin/env sh
set -eu

if [ ! -f .env.staging ]; then
  echo "Missing .env.staging. Copy .env.staging.example and fill staging values first." >&2
  exit 1
fi

set -a
. ./.env.staging
set +a

node scripts/pre_staging_check.js
node backend/server.js
