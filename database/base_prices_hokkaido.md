# JTDOS BASE PRICES - HOKKAIDO HISTORICAL REFERENCE

## 1. Status

This file is historical reference only.

It must not be used as the formal Hokkaido quote source for JTDOS Alpha 0.1.

## 2. Formal Hokkaido Price Sources

Codex and operators should read:

```text
database/base_prices_hokkaido_real_v1.md
```

Application code must read:

```text
database/jtdos_hokkaido_price_real_v1.json
```

## 3. Rule

If `region = Hokkaido`, `generate_quote` must prioritize:

```text
database/jtdos_hokkaido_price_real_v1.json
```

Do not use old USD placeholder prices as the official Hokkaido quote source.
