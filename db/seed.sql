-- CRAV E-Book Creator - Seed Data

-- Credit Plans
INSERT INTO credit_plans(id, name, monthly_allowance) VALUES
  ('free', 'Free', 200),
  ('pro', 'Pro', 5000),
  ('scale', 'Scale', 20000)
ON CONFLICT (id) DO NOTHING;

-- Credit Prices (per operation)
INSERT INTO credit_prices(meter, unit_cost) VALUES
  ('OUTLINE', 5),
  ('CHAPTER', 15),
  ('SNIPPET', 1),
  ('IMAGE', 5),
  ('EXPORT', 10)
ON CONFLICT (meter) DO NOTHING;
