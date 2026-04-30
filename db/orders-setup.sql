-- ============================================================
-- PD Seasoning — Orders Table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- If you have an old orders table from a previous setup, drop it
-- first (only if it has no real orders you need to keep):
--   drop table if exists public.orders;
-- ============================================================

create table if not exists public.orders (
  id                bigserial    primary key,
  order_code        text         unique not null,
  customer_email    text         not null,
  first_name        text,
  last_name         text,
  phone             text,
  shipping_address  text,
  city              text,
  state             text,
  zip               text,
  items             jsonb        not null default '[]',
  subtotal_cents    integer      not null default 0,
  shipping_cents    integer      not null default 0,
  total_cents       integer      not null default 0,
  square_payment_id text,
  square_order_id   text,
  payment_status    text         not null default 'pending',
  created_at        timestamptz  not null default now()
);

-- Indexes for admin lookups
create index if not exists orders_customer_email_idx    on public.orders (customer_email);
create index if not exists orders_square_payment_id_idx on public.orders (square_payment_id);
create index if not exists orders_created_at_idx        on public.orders (created_at desc);

-- RLS: no public read — all access via service role key (bypasses RLS automatically)
alter table public.orders enable row level security;
