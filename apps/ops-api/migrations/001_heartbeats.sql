-- HashTap ops: installations + heartbeats
-- Central database for restaurant fleet monitoring.

CREATE TABLE IF NOT EXISTS installations (
  installation_id TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  package         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  token_hash      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS heartbeats (
  id              BIGSERIAL PRIMARY KEY,
  installation_id TEXT NOT NULL REFERENCES installations(installation_id) ON DELETE CASCADE,
  collected_at    TIMESTAMPTZ NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  version         TEXT NOT NULL,
  uptime_seconds  BIGINT NOT NULL,
  disk_used_pct   NUMERIC(5,2) NOT NULL,
  memory_used_pct NUMERIC(5,2) NOT NULL,
  services        JSONB NOT NULL,
  metrics_24h     JSONB
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_installation_time
  ON heartbeats (installation_id, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_heartbeats_received
  ON heartbeats (received_at DESC);
