-- Migration: create products table
-- Run this in Supabase → SQL Editor if the products table does not exist.

create table if not exists public.products (
  id                  bigserial primary key,
  slug                text        not null unique,
  sku                 text        unique,
  name                text        not null,
  blurb               text,
  story               text,
  ingredients         text,
  full_description    text,
  price               numeric(10,2),
  compare_at_price    numeric(10,2),
  category            text,
  tags                text[]      default '{}',
  image               text,
  gallery_images      text[]      default '{}',
  inventory_count     integer     not null default 0,
  in_stock            boolean     not null default true,
  featured            boolean     not null default false,
  active              boolean     not null default true,
  sort_order          integer     not null default 0,
  square_payment_link text,
  ecwid_product_id    integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index for fast active-product queries
create index if not exists products_active_sort_idx
  on public.products (active, sort_order asc, name asc);

-- Auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- RLS: anon users can read active products; service role can do everything
alter table public.products enable row level security;

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  using (active = true);
