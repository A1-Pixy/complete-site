-- ============================================================
-- SUPABASE_SCHEMA_TEMPLATE.sql — Cart System Package v1
--
-- Reusable SQL template based only on confirmed code evidence.
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Tables confirmed in repo:
--   public.products  — used by products-get and products-admin
--   public.orders    — used by orders-create
--   public.leads     — used by mailchimp-sync (not cart flow)
--
-- Before running in production:
--   Confirm against current Supabase schema to avoid duplicate columns.
-- ============================================================


-- ============================================================
-- TABLE: public.products
-- Used by: products-get.mjs (READ), products-admin.mjs (WRITE)
-- Source evidence: db/products-setup.sql, functions/products-get.mjs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id                  bigserial       PRIMARY KEY,
  slug                text,                              -- URL key
  sku                 text            NOT NULL,          -- inventory SKU (unique)
  name                text            NOT NULL DEFAULT '',
  blurb               text,                              -- short card description
  story               text,                              -- product page narrative
  ingredients         text,
  full_description    text,                              -- optional rich text
  price               numeric(10,2),
  compare_at_price    numeric(10,2),                     -- strikethrough price
  category            text,
  tags                text[]          DEFAULT '{}',
  image               text,                              -- main image path/URL
  gallery_images      jsonb           DEFAULT '[]',
  inventory_count     integer         DEFAULT 0,
  in_stock            boolean         NOT NULL DEFAULT true,
  featured            boolean         NOT NULL DEFAULT false,
  active              boolean         NOT NULL DEFAULT true,
  sort_order          integer         NOT NULL DEFAULT 0,
  square_payment_link text,
  ecwid_product_id    bigint,                            -- legacy Ecwid ID
  created_at          timestamptz     NOT NULL DEFAULT now(),
  updated_at          timestamptz     NOT NULL DEFAULT now()
);

-- Unique constraint on sku
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_sku_key'
    AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
END $$;

-- Unique constraint on slug
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_slug_key'
    AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS products_slug_idx       ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_sku_idx        ON public.products (sku);
CREATE INDEX IF NOT EXISTS products_category_idx   ON public.products (category);
CREATE INDEX IF NOT EXISTS products_active_idx     ON public.products (active);
CREATE INDEX IF NOT EXISTS products_featured_idx   ON public.products (featured);
CREATE INDEX IF NOT EXISTS products_sort_order_idx ON public.products (sort_order ASC);

-- Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products"
  ON public.products
  FOR SELECT
  USING (active = true);

-- Note: products-admin writes use the service_role key, which bypasses RLS.


-- ============================================================
-- TABLE: public.orders
-- Used by: orders-create.mjs (WRITE)
-- Source evidence: db/orders-setup.sql, functions/orders-create.mjs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id                bigserial    PRIMARY KEY,
  order_code        text         UNIQUE NOT NULL,
  customer_email    text         NOT NULL,
  first_name        text,
  last_name         text,
  phone             text,
  shipping_address  text,
  city              text,
  state             text,
  zip               text,
  items             jsonb        NOT NULL DEFAULT '[]',
  -- items shape: [{ key, title, price, qty, image }]
  subtotal_cents    integer      NOT NULL DEFAULT 0,
  shipping_cents    integer      NOT NULL DEFAULT 0,
  total_cents       integer      NOT NULL DEFAULT 0,
  -- Free shipping threshold: 3700 cents ($37.00)
  -- Shipping cost: 599 cents ($5.99) if below threshold
  square_payment_id text,
  square_order_id   text,
  payment_status    text         NOT NULL DEFAULT 'pending',
  -- payment_status values: 'paid', 'pending', 'unpaid'
  created_at        timestamptz  NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS orders_customer_email_idx    ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS orders_square_payment_id_idx ON public.orders (square_payment_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx        ON public.orders (created_at DESC);

-- Row Level Security: all access via service_role key (bypasses RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLE: public.leads
-- Used by: mailchimp-sync.js (WRITE — not cart flow)
-- Source evidence: db/leads-migrate.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL,
  name       text        NOT NULL DEFAULT '',
  tag        text        NOT NULL DEFAULT 'VIP',
  source     text        NOT NULL DEFAULT 'popup',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);
CREATE INDEX IF NOT EXISTS leads_tag_idx   ON public.leads (tag);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- No public-facing policy needed — service_role key bypasses RLS for all writes.
