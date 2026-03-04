-- Rename column: provider → provider_id
-- D1 (SQLite) does not support ALTER TABLE ... RENAME COLUMN,
-- so we recreate each affected table.

-- ============================================================
-- 1. upstream_credentials
-- ============================================================

CREATE TABLE upstream_credentials_new (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    auth_type TEXT NOT NULL DEFAULT 'api_key',
    encrypted_secret TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    secret_hint TEXT NOT NULL,
    quota REAL,
    quota_source TEXT,
    is_enabled INTEGER DEFAULT 1,
    price_multiplier REAL NOT NULL DEFAULT 1.0,
    health_status TEXT DEFAULT 'unknown',
    last_health_check INTEGER,
    metadata TEXT,
    added_at INTEGER NOT NULL
);

INSERT INTO upstream_credentials_new
    (id, owner_id, provider_id, auth_type, encrypted_secret, secret_hash,
     secret_hint, quota, quota_source, is_enabled, price_multiplier,
     health_status, last_health_check, metadata, added_at)
SELECT
    id, owner_id, provider, auth_type, encrypted_secret, secret_hash,
    secret_hint, quota, quota_source, is_enabled, price_multiplier,
    health_status, last_health_check, metadata, added_at
FROM upstream_credentials;

DROP TABLE upstream_credentials;
ALTER TABLE upstream_credentials_new RENAME TO upstream_credentials;

CREATE INDEX idx_credentials_owner ON upstream_credentials(owner_id);
CREATE UNIQUE INDEX idx_credentials_secret_hash ON upstream_credentials(secret_hash);
CREATE INDEX idx_credentials_provider ON upstream_credentials(provider_id, is_enabled, health_status);

-- ============================================================
-- 2. model_pricing
-- ============================================================

CREATE TABLE model_pricing_new (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    name TEXT,
    input_price REAL NOT NULL,
    output_price REAL NOT NULL,
    context_length INTEGER,
    input_modalities TEXT,
    output_modalities TEXT,
    is_active INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    upstream_model_id TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    refreshed_at INTEGER NOT NULL
);

INSERT INTO model_pricing_new
    (id, provider_id, model_id, name, input_price, output_price,
     context_length, input_modalities, output_modalities, is_active,
     sort_order, upstream_model_id, metadata, created_at, refreshed_at)
SELECT
    id, provider, model_id, name, input_price, output_price,
    context_length, input_modalities, output_modalities, is_active,
    sort_order, upstream_model_id, metadata, created_at, refreshed_at
FROM model_pricing;

DROP TABLE model_pricing;
ALTER TABLE model_pricing_new RENAME TO model_pricing;

CREATE UNIQUE INDEX idx_model_pricing_provider_model ON model_pricing(provider_id, model_id);
CREATE INDEX idx_model_pricing_routing ON model_pricing(model_id, is_active, input_price);
CREATE INDEX idx_model_pricing_sort ON model_pricing(model_id, sort_order);

-- ============================================================
-- 3. logs
-- ============================================================

CREATE TABLE logs_new (
    id TEXT PRIMARY KEY,
    consumer_id TEXT NOT NULL,
    credential_id TEXT NOT NULL,
    credential_owner_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    base_cost REAL NOT NULL,
    consumer_charged REAL NOT NULL DEFAULT 0,
    provider_earned REAL NOT NULL DEFAULT 0,
    platform_fee REAL NOT NULL DEFAULT 0,
    price_multiplier REAL NOT NULL DEFAULT 1.0,
    created_at INTEGER NOT NULL
);

INSERT INTO logs_new
    (id, consumer_id, credential_id, credential_owner_id, provider_id,
     model_id, input_tokens, output_tokens, base_cost, consumer_charged,
     provider_earned, platform_fee, price_multiplier, created_at)
SELECT
    id, consumer_id, credential_id, credential_owner_id, provider,
    model_id, input_tokens, output_tokens, base_cost, consumer_charged,
    provider_earned, platform_fee, price_multiplier, created_at
FROM logs;

DROP TABLE logs;
ALTER TABLE logs_new RENAME TO logs;

CREATE INDEX idx_logs_consumer_time ON logs(consumer_id, created_at);
CREATE INDEX idx_logs_credential_owner_time ON logs(credential_owner_id, created_at);
CREATE INDEX idx_logs_created ON logs(created_at);
