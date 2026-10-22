CREATE TABLE leads (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'palm-website',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  whatsapp TEXT,
  cities TEXT NOT NULL,
  custom_city TEXT,
  travel_start TEXT,
  travel_end TEXT,
  needs TEXT,
  consent_at TEXT NOT NULL
);

CREATE INDEX leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX leads_status_idx ON leads (status, created_at DESC);
