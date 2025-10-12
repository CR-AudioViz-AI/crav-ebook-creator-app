/*
  # Add Snippets, Media Assets, and Export Tables

  1. New Tables
    - `snippet_jobs` - Track marketing snippet generation requests
    - `media_assets` - Store generated images and uploaded files
    - `ebook_exports` - Track export jobs and files

  2. Security
    - Enable RLS on all tables
    - Add policies for org-based access
*/

-- Snippet generation jobs
CREATE TABLE IF NOT EXISTS snippet_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  topic text NOT NULL,
  tone text,
  type text NOT NULL DEFAULT 'social',
  variants int NOT NULL DEFAULT 5,
  result jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE snippet_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org snippets"
  ON snippet_jobs FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create snippets"
  ON snippet_jobs FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Media assets (generated images, uploaded files)
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  manuscript_id uuid REFERENCES manuscripts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  url text NOT NULL,
  alt text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org media"
  ON media_assets FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create media"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own media"
  ON media_assets FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete own media"
  ON media_assets FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- E-book exports
CREATE TABLE IF NOT EXISTS ebook_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  format text NOT NULL,
  url text,
  status text DEFAULT 'PENDING',
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ebook_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org exports"
  ON ebook_exports FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create exports"
  ON ebook_exports FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own exports"
  ON ebook_exports FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS snippet_jobs_org_id_idx ON snippet_jobs(org_id);
CREATE INDEX IF NOT EXISTS snippet_jobs_created_at_idx ON snippet_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS media_assets_org_id_idx ON media_assets(org_id);
CREATE INDEX IF NOT EXISTS media_assets_manuscript_id_idx ON media_assets(manuscript_id);
CREATE INDEX IF NOT EXISTS ebook_exports_manuscript_id_idx ON ebook_exports(manuscript_id);
CREATE INDEX IF NOT EXISTS ebook_exports_org_id_idx ON ebook_exports(org_id);
