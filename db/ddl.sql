-- CRAV E-Book Creator Database Schema
-- Compatible with PostgreSQL / Supabase

-- Organizations & Users
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

-- Credits System
CREATE TABLE IF NOT EXISTS credit_wallets (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_email text,
  delta int NOT NULL,
  meter text NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Credit Plans & Pricing
CREATE TABLE IF NOT EXISTS credit_plans (
  id text PRIMARY KEY,
  name text,
  monthly_allowance int
);

CREATE TABLE IF NOT EXISTS credit_prices (
  meter text PRIMARY KEY,
  unit_cost int
);

-- Manuscripts & Chapters
CREATE TABLE IF NOT EXISTS manuscripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  author text DEFAULT 'Unknown Author',
  status text DEFAULT 'DRAFT',
  brief jsonb DEFAULT '{}',
  cover_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid REFERENCES manuscripts(id) ON DELETE CASCADE,
  position int NOT NULL,
  title text NOT NULL,
  content_md text DEFAULT '',
  content_html text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Snippets, Media & Exports
CREATE TABLE IF NOT EXISTS snippet_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  topic text,
  tone text,
  type text DEFAULT 'social',
  variants int,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  manuscript_id uuid,
  kind text,
  url text NOT NULL,
  alt text,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ebook_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  manuscript_id uuid REFERENCES manuscripts(id) ON DELETE CASCADE,
  format text,
  url text,
  status text DEFAULT 'READY',
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_manuscripts_org ON manuscripts(org_id);
CREATE INDEX IF NOT EXISTS idx_chapters_manuscript ON chapters(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_chapters_position ON chapters(manuscript_id, position);
CREATE INDEX IF NOT EXISTS idx_ledger_org ON credit_ledger(org_id);
CREATE INDEX IF NOT EXISTS idx_snippets_org ON snippet_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_media_org ON media_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_exports_org ON ebook_exports(org_id);
