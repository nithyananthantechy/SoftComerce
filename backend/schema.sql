-- Softcomerce PostgreSQL schema
-- Run manually if not using SQLAlchemy auto-create

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  category TEXT CHECK (category IN ('web', 'mobile', 'custom_software')),
  requirements_raw TEXT NOT NULL,
  requirements_structured JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'needs_human_review', 'abandoned')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_versions (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES requests(id),
  version_number INTEGER NOT NULL,
  scope_breakdown JSONB,
  budget_min NUMERIC,
  budget_max NUMERIC,
  timeline_estimate TEXT,
  assumptions TEXT,
  exclusions TEXT,
  client_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_card (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  component_name TEXT NOT NULL,
  complexity_tier TEXT CHECK (complexity_tier IN ('simple', 'medium', 'complex')),
  base_price NUMERIC NOT NULL,
  unit TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES requests(id),
  alert_type TEXT CHECK (alert_type IN ('confirmed', 'needs_human_review')),
  sent_at TIMESTAMP DEFAULT NOW(),
  email_status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_category ON requests(category);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_request ON proposal_versions(request_id);
