# ADR-015: /v1/models API Design

## Status
Implemented (2026-02-28)

## Context

Keyaos aggregates models from multiple upstream providers (OpenRouter, DeepInfra, ZenMux, etc.) and routes requests to the cheapest healthy provider. The `/v1/models` API exposes the model catalog to downstream users.

OpenRouter is the canonical model catalog — their `/api/v1/models` response defines the available model set and provides rich metadata (description, architecture, supported_parameters, pricing, etc.).

## Design Principles

### 1. One entry per model, no duplicates

Each `model_id` appears exactly once. Internally, the same model may exist across 3+ providers at different prices — this is an implementation detail hidden from the API consumer.

### 2. Candle-based pricing (pre-aggregated, zero real-time computation)

`pricing.prompt` and `pricing.completion` are sourced from **K-line candle `close_price`** data, updated every minute by the cron worker:

- `model:input` candle → `pricing.prompt`
- `model:output` candle → `pricing.completion`

Candle data reflects **actual transaction prices** (effective `input_price × price_multiplier` at time of trade) or quoted prices when no trades have occurred.

**Multi-modal pricing** (image, audio, cache, reasoning) is derived via discount ratio:

```
ratio = candle_close_price(prompt) / metadata_pricing(prompt)
image_price = metadata_pricing(image) × ratio
```

This approach eliminates:
- Per-request SQL JOINs with `upstream_credentials`
- Vulnerability to low-multiplier credentials with no actual quota
- Repeated `JSON.parse(metadata)` overhead under concurrent load

### 3. Clean public interface, no internal leakage

The response **omits**:
- `upstream_model_id`, `is_active`, `refreshed_at` — internal routing/sync fields
- `canonical_slug`, `top_provider`, `per_request_limits`, `default_parameters`, `expiration_date`, `discount` — OpenRouter-specific fields

The response **passes through**:
- `hugging_face_id` — useful for developers referencing HuggingFace model cards
- `architecture` — complete object including `tokenizer`, `instruct_type`, `modality`, `input_modalities`, `output_modalities`

### 4. Providers as capability indicator

`providers: ["openrouter", "deepinfra"]` lists which upstream providers can serve this model. Only providers with **active, healthy credentials** are included.

## Response Format

```json
{
  "data": [
    {
      "id": "google/gemini-3.1-pro-preview",
      "name": "Google: Gemini 3.1 Pro Preview",
      "created": 1771509627,
      "description": "Gemini 3.1 Pro Preview is...",
      "hugging_face_id": null,
      "context_length": 1048576,
      "pricing": {
        "prompt": "0.000002",
        "completion": "0.000012",
        "image": "0.000002",
        "internal_reasoning": "0.000012",
        "input_cache_read": "0.0000002",
        "input_cache_write": "0.000000375"
      },
      "architecture": {
        "modality": "text+image+audio+video->text",
        "input_modalities": ["audio", "image", "text", "video"],
        "output_modalities": ["text"],
        "tokenizer": "Gemini",
        "instruct_type": null
      },
      "supported_parameters": ["include_reasoning", "max_tokens", "tools"],
      "providers": ["openrouter", "deepinfra"]
    }
  ]
}
```

### Field Sources

| Field | Source | Notes |
|---|---|---|
| `id` | OpenRouter `id` | Canonical model identifier |
| `name` | OpenRouter `name` | Display name |
| `created` | OpenRouter `created` | Epoch seconds |
| `description` | OpenRouter `description` | Full model description |
| `hugging_face_id` | OpenRouter `hugging_face_id` | HuggingFace reference |
| `context_length` | OpenRouter `context_length` | Max tokens |
| `pricing.prompt` | **K-line candle** `model:input` | Real transaction close price |
| `pricing.completion` | **K-line candle** `model:output` | Real transaction close price |
| `pricing.*` (other) | **Derived** | `metadata_price × discount_ratio` |
| `architecture` | OpenRouter `architecture` | Full object pass-through |
| `supported_parameters` | OpenRouter `supported_parameters` | API capability list |
| `providers` | **Calculated** | Providers with active credentials |

## Dual Route Architecture

| Route | Purpose | Auth | Format |
|---|---|---|---|
| `/v1/models` | Public API — downstream consumers | API key / Clerk / Admin | Aggregated, one per model |
| `/api/models` | Dashboard — multi-provider comparison | Clerk / Admin | Per-provider rows with pricing details |

## K-line Candle Dimensions

| Dimension | Price Unit | Source |
|---|---|---|
| `model:input` | USD/M tokens | `input_price × price_multiplier` per trade |
| `model:output` | USD/M tokens | `output_price × price_multiplier` per trade |
| `provider` | multiplier ratio | `price_multiplier` per trade |

## Related Files

- `worker/routes/models.ts` — Both route handlers
- `worker/core/db/candle-dao.ts` — `getLatestPrices()`, `aggregate()`, `generateQuotedCandles()`
- `worker/core/db/pricing-dao.ts` — `getActivePricingWithBestMultiplier()` for grouping
- `worker/core/providers/registry.ts` — `parseOpenRouterModels()` stores `metadata`
