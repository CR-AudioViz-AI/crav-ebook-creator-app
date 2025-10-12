/*
  # Add Chapters Table

  1. New Tables
    - `chapters` - Store individual book chapters with HTML content

  2. Security
    - Enable RLS on chapters table
    - Add policies for org-based access
*/

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  title text NOT NULL,
  position int NOT NULL DEFAULT 1,
  content_html text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org chapters"
  ON chapters FOR SELECT
  TO authenticated
  USING (
    manuscript_id IN (
      SELECT id FROM manuscripts WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create chapters"
  ON chapters FOR INSERT
  TO authenticated
  WITH CHECK (
    manuscript_id IN (
      SELECT id FROM manuscripts WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own chapters"
  ON chapters FOR UPDATE
  TO authenticated
  USING (
    manuscript_id IN (
      SELECT id FROM manuscripts WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    manuscript_id IN (
      SELECT id FROM manuscripts WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own chapters"
  ON chapters FOR DELETE
  TO authenticated
  USING (
    manuscript_id IN (
      SELECT id FROM manuscripts WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chapters_manuscript_id_idx ON chapters(manuscript_id);
CREATE INDEX IF NOT EXISTS chapters_position_idx ON chapters(manuscript_id, position);
