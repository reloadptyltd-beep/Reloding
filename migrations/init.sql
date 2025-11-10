-- users table
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  paypal_payout_email text,
  crypto_address text,
  bank_account_json jsonb, -- store EFT/Bank details encrypted in production
  balance_cents bigint DEFAULT 0
);

-- withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id),
  amount_cents bigint NOT NULL,
  currency text NOT NULL, -- "USD", "USDT", etc.
  method text NOT NULL, -- "paypal", "usdt_trc20", "eft"
  destination text, -- e.g. paypal email or crypto address or bank id
  status text DEFAULT 'requested', -- requested, processing, paid, failed
  provider_response jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
