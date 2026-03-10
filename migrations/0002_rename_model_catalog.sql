-- Rename model_pricing → model_catalog
ALTER TABLE model_pricing RENAME TO model_catalog;

-- Recreate indexes with correct names
DROP INDEX IF EXISTS idx_model_pricing_provider_model;
DROP INDEX IF EXISTS idx_model_pricing_routing;
DROP INDEX IF EXISTS idx_model_pricing_created;

CREATE UNIQUE INDEX IF NOT EXISTS idx_model_catalog_provider_model ON model_catalog(provider_id, model_id);
CREATE INDEX IF NOT EXISTS idx_model_catalog_routing ON model_catalog(model_id, is_active, input_price);
CREATE INDEX IF NOT EXISTS idx_model_catalog_created ON model_catalog(is_active, created DESC);
