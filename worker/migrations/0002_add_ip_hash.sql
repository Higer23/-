-- Apply only to an existing database created with the original schema.
-- For a fresh database, use schema.sql instead.
ALTER TABLE entries ADD COLUMN ip_hash TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS banned_ips (
  ip_hash TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT 'Forum moderasyonu',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_limits_ip_time ON post_limits(ip_hash, created_at);
