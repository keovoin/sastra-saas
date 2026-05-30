-- ============================================================================
-- SASTRA BUSINESS OS — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================================

-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null default '',
  avatar_url text default '',
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked to auth.users with role-based access';

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    'admin'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PROJECTS TABLE
-- ============================================================================
create table public.projects (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text default '',
  owner_id uuid references public.profiles(id) on delete cascade not null
);

comment on table public.projects is 'Top-level project containers owned by a user';

-- 3. RISKS TABLE
-- ============================================================================
create table public.risks (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  description text not null,
  probability integer not null default 3 check (probability >= 1 and probability <= 5),
  impact integer not null default 3 check (impact >= 1 and impact <= 5),
  severity integer generated always as (probability * impact) stored,
  owner_name text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Mitigated', 'Watch'))
);

comment on table public.risks is 'Risk register entries belonging to a project';

-- 4. SWOT_ITEMS TABLE
-- ============================================================================
create table public.swot_items (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  type text not null check (type in ('strength', 'weakness', 'opportunity', 'threat')),
  content text not null,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High'))
);

comment on table public.swot_items is 'SWOT analysis items belonging to a project';

-- 5. CHARTERS TABLE
-- ============================================================================
create table public.charters (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  sponsor text not null default '',
  start_date date,
  in_scope text[] not null default '{}',
  out_of_scope text[] not null default '{}',
  team_members text[] not null default '{}'
);

comment on table public.charters is 'Project charter documents with scope and team definitions';

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict data isolation: users can only access their own project data
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.risks enable row level security;
alter table public.swot_items enable row level security;
alter table public.charters enable row level security;

-- PROFILES: Users can read/update only their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- PROJECTS: Full CRUD for project owner only
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = owner_id);

create policy "Users can create projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = owner_id);

-- RISKS: Access via project ownership (join through projects table)
create policy "Users can view risks in own projects"
  on public.risks for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = risks.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can insert risks in own projects"
  on public.risks for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = risks.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can update risks in own projects"
  on public.risks for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = risks.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can delete risks in own projects"
  on public.risks for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = risks.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- SWOT_ITEMS: Access via project ownership
create policy "Users can view swot_items in own projects"
  on public.swot_items for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = swot_items.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can insert swot_items in own projects"
  on public.swot_items for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = swot_items.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can update swot_items in own projects"
  on public.swot_items for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = swot_items.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can delete swot_items in own projects"
  on public.swot_items for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = swot_items.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- CHARTERS: Access via project ownership
create policy "Users can view charters in own projects"
  on public.charters for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = charters.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can insert charters in own projects"
  on public.charters for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = charters.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can update charters in own projects"
  on public.charters for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = charters.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can delete charters in own projects"
  on public.charters for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = charters.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. ENABLE REALTIME
-- Required for postgres_changes subscriptions in the client
-- ============================================================================
alter publication supabase_realtime add table public.risks;
alter publication supabase_realtime add table public.swot_items;
alter publication supabase_realtime add table public.charters;
alter publication supabase_realtime add table public.projects;

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================
create index idx_projects_owner on public.projects(owner_id);
create index idx_risks_project on public.risks(project_id);
create index idx_risks_severity on public.risks(severity desc);
create index idx_swot_items_project on public.swot_items(project_id);
create index idx_swot_items_type on public.swot_items(type);
create index idx_charters_project on public.charters(project_id);

-- ============================================================================
-- 9. UPDATED_AT TRIGGER (auto-update timestamp on row modification)
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at_column();

create trigger update_risks_updated_at
  before update on public.risks
  for each row execute function public.update_updated_at_column();

create trigger update_swot_items_updated_at
  before update on public.swot_items
  for each row execute function public.update_updated_at_column();

create trigger update_charters_updated_at
  before update on public.charters
  for each row execute function public.update_updated_at_column();
