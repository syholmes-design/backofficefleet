-- Optional LIVE mapping for Product Authority commodity_class.
-- Existing rows remain NULL. Do not backfill DEMO commodity strings.
ALTER TABLE "Load" ADD COLUMN "commodityClass" TEXT;
