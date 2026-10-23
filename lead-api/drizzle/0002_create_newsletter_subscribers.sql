CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  subscribed_at TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'subscribed'
);

CREATE INDEX newsletter_subscribed_at_idx ON newsletter_subscribers (subscribed_at DESC);
