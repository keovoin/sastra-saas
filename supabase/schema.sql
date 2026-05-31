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


-- ============================================================================
-- 10. NEW TABLES FOR EXTENDED MODULES
-- Run this AFTER the initial schema above
-- ============================================================================

-- TASKS TABLE (Project Board / Kanban)
create table public.tasks (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text default '',
  assignee text default '',
  priority text not null default 'P3' check (priority in ('P1', 'P2', 'P3', 'P4')),
  labels text[] not null default '{}',
  due_date date,
  column_id text not null default 'todo',
  "order" integer not null default 0
);

alter table public.tasks enable row level security;
create policy "Users can manage tasks in own projects" on public.tasks for all
  using (exists (select 1 from public.projects where projects.id = tasks.project_id and projects.owner_id = auth.uid()));
alter publication supabase_realtime add table public.tasks;
create index idx_tasks_project on public.tasks(project_id);

-- MESSAGES TABLE (Chat)
create table public.messages (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  channel_id text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null default '',
  content text not null,
  reply_to uuid references public.messages(id) on delete set null
);

alter table public.messages enable row level security;
create policy "Authenticated users can manage messages" on public.messages for all using (auth.uid() is not null);
alter publication supabase_realtime add table public.messages;
create index idx_messages_channel on public.messages(channel_id);

-- CHANNELS TABLE (Chat)
create table public.channels (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  name text not null,
  type text not null default 'group' check (type in ('direct', 'group', 'forum')),
  description text default '',
  created_by uuid references public.profiles(id) on delete set null,
  members text[] not null default '{}'
);

alter table public.channels enable row level security;
create policy "Authenticated users can manage channels" on public.channels for all using (auth.uid() is not null);

-- CALENDAR EVENTS TABLE
create table public.calendar_events (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  event_date date not null,
  type text not null default 'custom' check (type in ('custom', 'milestone', 'risk-review', 'deal-followup', 'task-due', 'meeting')),
  description text default ''
);

alter table public.calendar_events enable row level security;
create policy "Users can manage events in own projects" on public.calendar_events for all
  using (exists (select 1 from public.projects where projects.id = calendar_events.project_id and projects.owner_id = auth.uid()));
create index idx_calendar_events_project on public.calendar_events(project_id);
create index idx_calendar_events_date on public.calendar_events(event_date);

-- ONBOARDING CHECKLISTS TABLE
create table public.onboarding_checklists (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  employee_name text not null,
  role text default '',
  start_date date,
  steps jsonb not null default '[]'
);

alter table public.onboarding_checklists enable row level security;
create policy "Users can manage checklists in own projects" on public.onboarding_checklists for all
  using (exists (select 1 from public.projects where projects.id = onboarding_checklists.project_id and projects.owner_id = auth.uid()));

-- OFFBOARDING CHECKLISTS TABLE
create table public.offboarding_checklists (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  employee_name text not null,
  department text default '',
  last_day date,
  steps jsonb not null default '[]'
);

alter table public.offboarding_checklists enable row level security;
create policy "Users can manage offboarding in own projects" on public.offboarding_checklists for all
  using (exists (select 1 from public.projects where projects.id = offboarding_checklists.project_id and projects.owner_id = auth.uid()));

-- EMPLOYEE MOVEMENTS TABLE
create table public.employee_movements (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  employee_name text not null,
  movement_type text not null default 'promotion' check (movement_type in ('promotion', 'transfer', 'role-change')),
  from_role text default '',
  from_dept text default '',
  to_role text default '',
  to_dept text default '',
  approved_by text default '',
  movement_date date not null default current_date,
  notes text default ''
);

alter table public.employee_movements enable row level security;
create policy "Users can manage movements in own projects" on public.employee_movements for all
  using (exists (select 1 from public.projects where projects.id = employee_movements.project_id and projects.owner_id = auth.uid()));

-- Add mitigation and controls columns to risks table
alter table public.risks add column if not exists mitigation text default '';
alter table public.risks add column if not exists controls text default '';

-- Add triggers for new tables
create trigger update_tasks_updated_at before update on public.tasks for each row execute function public.update_updated_at_column();



-- ============================================================================
-- 11. ADDITIONAL TABLES FOR PIPELINE, KPIs, AND INVOICES
-- ============================================================================

-- PIPELINE DEALS TABLE
create table if not exists public.pipeline_deals (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  company text not null,
  value numeric not null default 0,
  contact text default '',
  probability integer not null default 20,
  next_action text default '',
  stage text not null default 'lead',
  assignee text default ''
);
alter table public.pipeline_deals enable row level security;
create policy "Users can manage deals in own projects" on public.pipeline_deals for all
  using (exists (select 1 from public.projects where projects.id = pipeline_deals.project_id and projects.owner_id = auth.uid()));
alter publication supabase_realtime add table public.pipeline_deals;

-- KPI METRICS TABLE
create table if not exists public.kpi_metrics (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  unit text default '',
  target numeric not null default 0
);
alter table public.kpi_metrics enable row level security;
create policy "Users can manage kpis in own projects" on public.kpi_metrics for all
  using (exists (select 1 from public.projects where projects.id = kpi_metrics.project_id and projects.owner_id = auth.uid()));

-- KPI VALUES TABLE
create table if not exists public.kpi_values (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  kpi_id uuid references public.kpi_metrics(id) on delete cascade not null,
  week text not null,
  value numeric not null default 0
);
alter table public.kpi_values enable row level security;
create policy "Users can manage kpi values" on public.kpi_values for all
  using (exists (select 1 from public.kpi_metrics inner join public.projects on projects.id = kpi_metrics.project_id where kpi_metrics.id = kpi_values.kpi_id and projects.owner_id = auth.uid()));

-- INVOICES TABLE
create table if not exists public.invoices (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  invoice_number text not null,
  client text not null,
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('paid', 'pending', 'overdue')),
  due_date date,
  issued_date date,
  remark text default '',
  reference_id text default ''
);
alter table public.invoices enable row level security;
create policy "Users can manage invoices in own projects" on public.invoices for all
  using (exists (select 1 from public.projects where projects.id = invoices.project_id and projects.owner_id = auth.uid()));
alter publication supabase_realtime add table public.invoices;

-- Indexes for new tables
create index idx_pipeline_deals_project on public.pipeline_deals(project_id);
create index idx_kpi_metrics_project on public.kpi_metrics(project_id);
create index idx_invoices_project on public.invoices(project_id);

-- Updated_at triggers for new tables
create trigger update_pipeline_deals_updated_at before update on public.pipeline_deals for each row execute function public.update_updated_at_column();
create trigger update_invoices_updated_at before update on public.invoices for each row execute function public.update_updated_at_column();


-- ============================================================================
-- 11. SAAS ADMIN PORTAL (Platform Owner)
-- Run this AFTER the schema above. Adds superadmin role + plan tracking.
-- ============================================================================

-- Add plan + status + superadmin columns to profiles
alter table public.profiles add column if not exists plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise'));
alter table public.profiles add column if not exists account_status text not null default 'active' check (account_status in ('active', 'suspended', 'banned'));
alter table public.profiles add column if not exists is_superadmin boolean not null default false;
alter table public.profiles add column if not exists email text default '';
alter table public.profiles add column if not exists last_active_at timestamptz default now();
alter table public.profiles add column if not exists paddle_customer_id text default '';

-- Add plan to projects (workspace-level plan)
alter table public.projects add column if not exists plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise'));

-- BILLING EVENTS TABLE (records Paddle webhook events)
create table if not exists public.billing_events (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  plan text default '',
  amount numeric default 0,
  currency text default 'USD',
  paddle_customer_id text default '',
  raw_data jsonb default '{}'
);
alter table public.billing_events enable row level security;
-- Only superadmins can read billing events
create policy "Superadmins can view billing events" on public.billing_events for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_superadmin = true));

-- ADMIN AUDIT LOG (records admin actions)
create table if not exists public.admin_audit_log (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text default '',
  target_id text default '',
  details jsonb default '{}'
);
alter table public.admin_audit_log enable row level security;
create policy "Superadmins can view audit log" on public.admin_audit_log for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_superadmin = true));
create policy "Superadmins can insert audit log" on public.admin_audit_log for insert
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_superadmin = true));

-- ─── SUPERADMIN ACCESS POLICIES ───────────────────────────────────────────
-- Allow superadmins to view ALL profiles (for user management)
create policy "Superadmins can view all profiles" on public.profiles for select
  using (exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_superadmin = true));

-- Allow superadmins to update ALL profiles (for plan assignment / suspension)
create policy "Superadmins can update all profiles" on public.profiles for update
  using (exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_superadmin = true));

-- Allow superadmins to view ALL projects (workspace management)
create policy "Superadmins can view all projects" on public.projects for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_superadmin = true));

-- Allow superadmins to update ALL projects (plan assignment)
create policy "Superadmins can update all projects" on public.projects for update
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_superadmin = true));

-- ─── HOW TO MAKE YOURSELF SUPERADMIN ──────────────────────────────────────
-- After running the above, run this with YOUR email to grant yourself access:
--
--   update public.profiles set is_superadmin = true
--   where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
--
-- ============================================================================


-- ============================================================================
-- 12. WORKSPACE HELP DESK (Internal Team Support Tickets)
-- Run this in Supabase SQL Editor after the schema above.
-- ============================================================================

create table if not exists public.tickets (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid references public.projects(id) on delete cascade not null,
  subject text not null,
  description text default '',
  requester_name text not null default '',
  requester_id uuid references public.profiles(id) on delete set null,
  assignee text default '',
  category text not null default 'general' check (category in ('it', 'hr', 'finance', 'facilities', 'general')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'new' check (status in ('new', 'assigned', 'in_progress', 'resolved', 'closed')),
  due_date date
);

alter table public.tickets enable row level security;
create policy "Users can manage tickets in own projects" on public.tickets for all
  using (exists (select 1 from public.projects where projects.id = tickets.project_id and projects.owner_id = auth.uid()));
alter publication supabase_realtime add table public.tickets;
create index if not exists idx_tickets_project on public.tickets(project_id);

create table if not exists public.ticket_replies (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamptz not null default now(),
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  author_name text not null default '',
  author_id uuid references public.profiles(id) on delete set null,
  content text not null
);

alter table public.ticket_replies enable row level security;
create policy "Users can manage ticket replies in own projects" on public.ticket_replies for all
  using (exists (
    select 1 from public.tickets
    inner join public.projects on projects.id = tickets.project_id
    where tickets.id = ticket_replies.ticket_id and projects.owner_id = auth.uid()
  ));
alter publication supabase_realtime add table public.ticket_replies;
create index if not exists idx_ticket_replies_ticket on public.ticket_replies(ticket_id);

create trigger update_tickets_updated_at before update on public.tickets
  for each row execute function public.update_updated_at_column();
