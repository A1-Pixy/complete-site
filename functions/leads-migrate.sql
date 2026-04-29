-- Pixy Dust Seasoning — Supabase leads table
-- Run once in your Supabase SQL editor (Dashboard → SQL Editor → New query)
--
-- This table stores every lead captured via:
--   popup, exit intent, chatbot, or any future capture point.

CREATE TABLE IF NOT EXISTS leads (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        NOT NULL,
  name       TEXT        NOT NULL DEFAULT '',
  tag        TEXT        NOT NULL DEFAULT 'VIP',
  source     TEXT        NOT NULL DEFAULT 'popup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by email (deduplication, reporting)
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);

-- Index for filtering by tag in the dashboard
CREATE INDEX IF NOT EXISTS leads_tag_idx ON leads (tag);

-- Row Level Security: all writes go through the Netlify function using the
-- service_role key, which bypasses RLS.  Enable RLS to prevent any direct
-- anonymous reads or writes from the browser.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- No public-facing policies needed — the service_role key used in
-- mailchimp-sync.js bypasses RLS for all operations.
-- If you want to query leads from a future admin dashboard using the anon key,
-- add a policy here (e.g. restricted by a Supabase auth role).
