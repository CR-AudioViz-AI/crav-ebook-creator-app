/*
  # CRAV E-Book Creator - Core Schema

  ## Overview
  Creates the foundational schema for a multi-tenant e-book creator platform with credits-based monetization.

  ## New Tables

  ### organizations
  - `id` (uuid, primary key) - Unique organization identifier
  - `name` (text) - Organization display name
  - `plan` (text) - Subscription tier: 'free', 'pro', 'scale'
  - `stripe_customer_id` (text, nullable) - Stripe customer reference
  - `stripe_subscription_id` (text, nullable) - Stripe subscription reference
  - `paypal_subscription_id` (text, nullable) - PayPal subscription reference
  - `created_at` (timestamptz) - Organization creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### users
  - `id` (uuid, primary key) - User unique identifier
  - `email` (text, unique) - User email address
  - `name` (text, nullable) - User display name
  - `role` (text) - User role: 'user', 'admin'
  - `org_id` (uuid, foreign key) - Organization membership
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login_at` (timestamptz, nullable) - Last successful login

  ### credit_balances
  - `org_id` (uuid, primary key) - Organization identifier
  - `balance` (bigint) - Current credit balance (never negative)
  - `last_grant_at` (timestamptz, nullable) - Last monthly grant timestamp
  - `updated_at` (timestamptz) - Last balance update

  ### credit_ledger
  - `id` (uuid, primary key) - Transaction unique identifier
  - `org_id` (uuid, foreign key) - Organization identifier
  - `user_id` (uuid, foreign key) - User who triggered transaction
  - `type` (text) - Transaction type: 'GRANT', 'TOPUP', 'SPEND', 'REFUND'
  - `amount` (bigint) - Credit amount (positive for add, negative for spend)
  - `reason` (text) - Transaction description
  - `meta` (jsonb, nullable) - Additional metadata
  - `idempotency_key` (text, nullable, unique) - Prevent duplicate transactions
  - `created_at` (timestamptz) - Transaction timestamp

  ### manuscripts
  - `id` (uuid, primary key) - Manuscript unique identifier
  - `org_id` (uuid, foreign key) - Owner organization
  - `user_id` (uuid, foreign key) - Creator user
  - `title` (text) - Manuscript title
  - `subtitle` (text, nullable) - Manuscript subtitle
  - `author` (text) - Author name
  - `description` (text) - Brief description
  - `brief` (jsonb) - Initial brief configuration
  - `outline` (text, nullable) - Generated outline
  - `chapters` (jsonb) - Array of chapter objects
  - `status` (text) - Status: 'draft', 'complete'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### audit_log
  - `id` (uuid, primary key) - Audit entry identifier
  - `org_id` (uuid, nullable) - Related organization
  - `user_id` (uuid, nullable) - User who performed action
  - `action` (text) - Action type
  - `ip` (text, nullable) - Request IP address
  - `user_agent` (text, nullable) - Browser user agent
  - `meta` (jsonb, nullable) - Additional context
  - `created_at` (timestamptz) - Action timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their organization's data
  - Admin users can access audit logs
  - Credit operations are strictly controlled

  ## Important Notes
  1. All tables use RLS for security
  2. Credit balance is maintained separately for performance
  3. Idempotency keys prevent duplicate credit transactions
  4. Audit log tracks all significant actions
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Organization',
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'scale')),
  stripe_customer_id text,
  stripe_subscription_id text,
  paypal_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create credit_balances table
CREATE TABLE IF NOT EXISTS credit_balances (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  last_grant_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;

-- Create credit_ledger table
CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('GRANT', 'TOPUP', 'SPEND', 'REFUND')),
  amount bigint NOT NULL,
  reason text NOT NULL,
  meta jsonb,
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_credit_ledger_org ON credit_ledger(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_idempotency ON credit_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Create manuscripts table
CREATE TABLE IF NOT EXISTS manuscripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  author text NOT NULL DEFAULT 'Unknown Author',
  description text DEFAULT '',
  brief jsonb DEFAULT '{}',
  outline text,
  chapters jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE manuscripts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_manuscripts_org ON manuscripts(org_id, created_at DESC);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  ip text,
  user_agent text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id, created_at DESC);

-- RLS Policies for organizations
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can update own organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT org_id FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- RLS Policies for users
CREATE POLICY "Users can view users in own organization"
  ON users FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for credit_balances
CREATE POLICY "Users can view own organization credits"
  ON credit_balances FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

-- RLS Policies for credit_ledger
CREATE POLICY "Users can view own organization ledger"
  ON credit_ledger FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "System can insert ledger entries"
  ON credit_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

-- RLS Policies for manuscripts
CREATE POLICY "Users can view own organization manuscripts"
  ON manuscripts FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can create manuscripts"
  ON manuscripts FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own manuscripts"
  ON manuscripts FOR UPDATE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can delete own manuscripts"
  ON manuscripts FOR DELETE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM users WHERE users.id = auth.uid())
  );

-- RLS Policies for audit_log
CREATE POLICY "Admins can view audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
      AND users.org_id = audit_log.org_id
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'organizations_updated_at') THEN
    CREATE TRIGGER organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'credit_balances_updated_at') THEN
    CREATE TRIGGER credit_balances_updated_at
      BEFORE UPDATE ON credit_balances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'manuscripts_updated_at') THEN
    CREATE TRIGGER manuscripts_updated_at
      BEFORE UPDATE ON manuscripts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;