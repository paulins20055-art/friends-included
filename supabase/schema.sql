create table if not exists public.employees (
  id text primary key,
  display_name text not null,
  role text not null check (role in ('manager','sales','expense')),
  telegram_user_id bigint unique,
  telegram_chat_id bigint
);

create table if not exists public.sales (
  ref text primary key check (ref ~ '^S[0-9]{2,}$'),
  submitted_at timestamptz not null default now(),
  salesperson_id text not null references public.employees(id),
  telegram_chat_id bigint,
  customer text not null,
  project text not null check (project in ('A','B')),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  proposed_richard_pct numeric(5,2) not null check (proposed_richard_pct between 0 and 100),
  proposed_anastasia_pct numeric(5,2) not null check (proposed_anastasia_pct between 0 and 100),
  proposed_jean_claude_pct numeric(5,2) not null check (proposed_jean_claude_pct between 0 and 100),
  approved_richard_pct numeric(5,2),
  approved_anastasia_pct numeric(5,2),
  approved_jean_claude_pct numeric(5,2),
  commission_pool numeric(12,2) not null default 0,
  commission_richard numeric(12,2) not null default 0,
  commission_anastasia numeric(12,2) not null default 0,
  commission_jean_claude numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','approved')),
  sheet_sync_status text not null default 'pending' check (sheet_sync_status in ('pending','synced','failed')),
  sheet_sync_error text,
  notification_status text not null default 'not_required' check (notification_status in ('not_required','pending','sent','failed')),
  notification_error text,
  approved_at timestamptz,
  constraint proposed_sale_split_is_100 check (proposed_richard_pct + proposed_anastasia_pct + proposed_jean_claude_pct = 100),
  constraint approved_sale_split_is_100 check (
    (approved_richard_pct is null and approved_anastasia_pct is null and approved_jean_claude_pct is null)
    or approved_richard_pct + approved_anastasia_pct + approved_jean_claude_pct = 100
  )
);

create table if not exists public.expenses (
  ref text primary key check (ref ~ '^E[0-9]{2,}$'),
  submitted_at timestamptz not null default now(),
  reporter_id text not null references public.employees(id),
  telegram_chat_id bigint,
  description text not null,
  category text not null check (category in ('Materials','Travel','Other')),
  amount numeric(12,2) not null check (amount > 0),
  proposed_allocation text not null check (proposed_allocation in ('A','B','OVERHEAD')),
  final_allocation text check (final_allocation in ('A','B','OVERHEAD')),
  status text not null check (status in ('awaiting_allocation','allocated')),
  sheet_sync_status text not null default 'pending' check (sheet_sync_status in ('pending','synced','failed')),
  sheet_sync_error text,
  notification_status text not null default 'not_required' check (notification_status in ('not_required','pending','sent','failed')),
  notification_error text,
  approved_at timestamptz
);

insert into public.employees (id, display_name, role) values
  ('svetlana','Svetlana de Monte Carlo','manager'),
  ('richard','Richard “Call Me Dick” Darling','sales'),
  ('anastasia','Anastasia Ferrari','sales'),
  ('jean-claude','Jean-Claude Bērziņš','sales'),
  ('kevin','Kevin von Whatever','expense')
on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;

alter table public.employees enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;

-- The browser never connects directly to these tables. Server routes use the
-- service-role key, and every write is validated again in the service layer.
