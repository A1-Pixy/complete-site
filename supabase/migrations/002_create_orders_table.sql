-- Migration: create orders table
-- Run this in Supabase → SQL Editor if the orders table does not exist.

create table if not exists public.orders (
  id                bigserial primary key,
  order_code        text        not null unique,
  customer_email    text        not null,
  first_name        text        not null default '',
  last_name         text        not null default '',
  phone             text,
  shipping_address  text        not null,
  city              text        not null,
  state             text        not null,
  zip               text        not null,
  -- items stored as JSONB array: [{key, title, price, qty, image}]
  items             jsonb       not null default '[]',
  subtotal_cents    integer     not null,
  shipping_cents    integer     not null,
  total_cents       integer     not null,
  square_payment_id text,
  square_order_id   text,
  -- payment_status: "paid" | "pending" | "unpaid"
  payment_status    text        not null default 'unpaid',
  created_at        timestamptz not null default now()
);

-- Index for looking up orders by email or code
create index if not exists orders_email_idx      on public.orders (customer_email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- RLS: only service_role can insert/read orders (no public access)
alter table public.orders enable row level security;

-- No policies = anon and authenticated roles are blocked.
-- The orders-create function uses the service_role key which bypasses RLS.
