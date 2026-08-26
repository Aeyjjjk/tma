-- ============================================================
-- FTLMS — Supabase schema
-- ============================================================
-- Two tables:
--   profiles   — one row per account, 1:1 with Supabase Auth's own
--                auth.users table. Passwords are NEVER stored here —
--                Supabase Auth owns and hashes those entirely; this
--                table only has the app-facing fields (name, role,
--                department, admin flag, status).
--   app_state  — tyres/equipment/inspections/activity as JSON columns.
--                Deliberately not fully normalized into their own
--                tables yet — see README for why, and what a fully
--                relational v2 would look like. This keeps the existing
--                frontend logic (which already treats these as arrays)
--                working with minimal changes, while still getting a
--                real shared Postgres database with real RLS.
--
-- Row Level Security (RLS) is what actually enforces "who can see/change
-- what" — not the frontend. Even if someone bypassed the UI entirely and
-- called the Supabase API directly, these policies are what stop them.

-- ----- profiles -----
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    name text not null,
    role text default '—',
    dept text default '—',
    is_admin boolean not null default false,
    status text not null default 'Active',
    last_active timestamptz,
    created_at timestamptz not null default now(),
    deleted boolean not null default false
);

alter table public.profiles enable row level security;

-- Any authorized (logged-in) user can see everyone's profile — this is
-- what makes the Users page and "who did what" actually work. Nothing
-- sensitive lives in this table (no password, ever), so this is safe.
create policy "profiles_select_authenticated"
    on public.profiles for select
    using (auth.role() = 'authenticated');

-- Only an existing, non-deleted admin can modify accounts (matches the
-- app's existing rule: "accounts are created and managed by an
-- administrator"). Row creation happens only via the admin-create-user
-- Edge Function (service-role, bypasses RLS by design) since it also has
-- to create the paired Supabase Auth user — there is deliberately no
-- INSERT policy here for ordinary clients.
create policy "profiles_update_admin_only"
    on public.profiles for update
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_admin = true and p.deleted = false
        )
    );

-- Lets a user update only their own last_active timestamp without a
-- blanket self-update policy that could be exploited to change other
-- fields (e.g. granting themselves admin). SECURITY DEFINER runs with
-- the function owner's privileges, but only ever touches auth.uid()'s
-- own row — deliberately narrow.
create or replace function public.touch_last_active()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.profiles set last_active = now() where id = auth.uid();
end;
$$;
grant execute on function public.touch_last_active() to authenticated;

-- ----- app_state (singleton row) -----
create table if not exists public.app_state (
    id int primary key default 1,
    tyres jsonb not null default '[]'::jsonb,
    equipment jsonb not null default '[]'::jsonb,
    inspections jsonb not null default '[]'::jsonb,
    activity_log jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id),
    constraint app_state_singleton check (id = 1)
);
insert into public.app_state (id) values (1) on conflict (id) do nothing;

alter table public.app_state enable row level security;

-- Any authorized user can read the shared fleet data — this is the
-- "everyone sees what everyone else has done" requirement.
create policy "app_state_select_authenticated"
    on public.app_state for select
    using (auth.role() = 'authenticated');

-- Any authorized user can write — matches the existing app, where
-- Inspectors/Supervisors register tyres and log inspections, not just
-- admins. See README for the "last write wins" trade-off this implies.
create policy "app_state_update_authenticated"
    on public.app_state for update
    using (auth.role() = 'authenticated');

-- Auto-stamp who changed the shared state and when, rather than trusting
-- the client to report this honestly.
create or replace function public.set_state_meta()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    new.updated_by = auth.uid();
    return new;
end;
$$;

drop trigger if exists trg_app_state_meta on public.app_state;
create trigger trg_app_state_meta
    before update on public.app_state
    for each row execute function public.set_state_meta();

-- Enable Realtime on both tables, so the frontend gets pushed updates
-- instead of polling.
alter publication supabase_realtime add table public.app_state;
alter publication supabase_realtime add table public.profiles;
