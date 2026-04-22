-- ============================================================
-- PD Seasoning — Products Table (Full Schema)
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Safe to run on a FRESH database OR an EXISTING products table.
-- ALTER TABLE statements below add missing columns only.
-- ============================================================

-- ── Create table (fresh install) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                  bigserial       PRIMARY KEY,
  slug                text,                              -- URL key, e.g. "deep-blue-seafood"
  sku                 text            NOT NULL,          -- inventory SKU (unique)
  name                text            NOT NULL DEFAULT '',
  blurb               text,                              -- 1-2 sentence card description
  story               text,                              -- longer narrative for product page
  ingredients         text,                              -- ingredient list
  full_description    text,                              -- optional rich text / HTML
  price               numeric(10,2),
  compare_at_price    numeric(10,2),                     -- for strikethrough pricing
  category            text,
  tags                text[]          DEFAULT '{}',      -- e.g. {"featured","keto","gift"}
  image               text,                              -- main image URL or path
  gallery_images      jsonb           DEFAULT '[]',      -- extra images: ["url1","url2"]
  inventory_count     integer         DEFAULT 0,
  in_stock            boolean         NOT NULL DEFAULT true,
  featured            boolean         NOT NULL DEFAULT false,
  active              boolean         NOT NULL DEFAULT true,
  sort_order          integer         NOT NULL DEFAULT 0,
  square_payment_link text,                              -- optional Square checkout URL
  ecwid_product_id    bigint,                            -- legacy Ecwid ID (kept for reference)
  created_at          timestamptz     NOT NULL DEFAULT now(),
  updated_at          timestamptz     NOT NULL DEFAULT now()
);

-- ── Unique constraints ─────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='products_sku_key'
                 AND conrelid='public.products'::regclass) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
END $$;

-- ── Add missing columns (safe to run on existing table) ────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug               text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS blurb              text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS story              text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients        text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS full_description   text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price   numeric(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags               text[]  DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images     jsonb   DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory_count    integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock           boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured           boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS square_payment_link text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- Backfill slug from sku where null
UPDATE public.products SET slug = sku WHERE slug IS NULL OR slug = '';

-- Add unique constraint on slug (once backfilled)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='products_slug_key'
                 AND conrelid='public.products'::regclass) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
  END IF;
END $$;

-- ── Auto-update updated_at on every edit ───────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS products_slug_idx       ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_sku_idx        ON public.products (sku);
CREATE INDEX IF NOT EXISTS products_category_idx   ON public.products (category);
CREATE INDEX IF NOT EXISTS products_active_idx     ON public.products (active);
CREATE INDEX IF NOT EXISTS products_featured_idx   ON public.products (featured);
CREATE INDEX IF NOT EXISTS products_sort_order_idx ON public.products (sort_order ASC);

-- ── Row Level Security ─────────────────────────────────────────
-- Public (anon key): can only read active products
-- Service role key: bypasses RLS automatically — used by admin functions
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products"
  ON public.products
  FOR SELECT
  USING (active = true);
