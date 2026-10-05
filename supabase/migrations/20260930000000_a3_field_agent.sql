-- A3 Job & Field Agent workflow tables. Apply with the Supabase CLI or SQL editor.
create extension if not exists "pgcrypto";

create table if not exists public.job_handovers (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  delivering_party text not null,
  receiving_party text not null,
  actual_pieces integer not null check (actual_pieces >= 0),
  actual_gross_weight numeric not null check (actual_gross_weight >= 0),
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_documentation (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  photos jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_verifications (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  document_verification text not null,
  package_condition text not null,
  airline_standard text not null,
  dangerous_goods boolean not null default false,
  special_handling jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_issues (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  category text not null,
  description text not null,
  evidence_url text,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists public.job_history (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  activity text not null,
  performed_by text not null,
  notes text not null default '-',
  created_at timestamptz not null default now()
);

create index if not exists job_handovers_job_number_idx on public.job_handovers (job_number, created_at desc);
create index if not exists job_documentation_job_number_idx on public.job_documentation (job_number, created_at desc);
create index if not exists job_verifications_job_number_idx on public.job_verifications (job_number, created_at desc);
create index if not exists job_issues_job_number_idx on public.job_issues (job_number, created_at desc);
create index if not exists job_history_job_number_idx on public.job_history (job_number, created_at asc);
