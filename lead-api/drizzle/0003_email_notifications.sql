CREATE TABLE IF NOT EXISTS email_notifications (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_id TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS email_notifications_status ON email_notifications(status);
