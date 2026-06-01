-- ============================================================================
-- SASTRA BUSINESS OS — MULTI-TENANT WORKSPACE AUTH
-- ============================================================================
-- This migration introduces invitation-only, path-based workspaces (/w/{slug}).
--
-- ▸ RUN ORDER (IMPORTANT):
--     STEP 1  — Run the whole "STEP 1" section below FIRST (DDL + RLS + realtime).
--               This is additive and safe; it does NOT touch existing data.
--     STEP 2  — Run the "STEP 2 — DATA MIGRATION" block at the very bottom AFTER
--               step 1 succeeds. It backfills a workspace for every existing
--               profile and links their projects. It is idempotent (safe to
--               re-run) thanks to ON CONFLICT / NOT EXISTS guards.
--
-- ▸ SCOPE / LIMITATION:
--     This migration only ADDS the new workspace tables + a nullable
--     projects.workspace_id column. It intentionally does NOT rewrite the RLS
--     on the existing data tables (projects/risks/tasks/swot_items/charters/etc).
--     Those remain scoped by `projects.owner_id = auth.uid()` exactly as before,
--     so the app keeps working unchanged. Migrating those tables to be
--     workspace-scoped (so all members can see shared data) is a deliberate
--     FOLLOW-UP step and must be done carefully to avoid data exposure.
-- ============================================================================


-- ============================================================================
-- STEP 1 — SCHEMA, FUNCTIONS, RLS, REALTIME  (run this first)
-- ============================================================================

-- ─── 1. WORKSPACES ──────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id uuid not null default gen_random_uuid() primary key,
  name text not null default '',
  slug text not null unique,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now()
);
comment on table public.workspaces is 'Top-level tenant container. Members join via invitation only.';

-- ─── 2. WORKSPACE MEMBERS ───────────────────────────────────────────────────
create table if not exists public.workspace_members (
  id uuid not null default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  department text not null default '',
  position text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
comment on table public.workspace_members is 'Membership + role of a user within a workspace.';

-- ─── 3. WORKSPACE INVITATIONS ───────────────────────────────────────────────
create table if not exists public.workspace_invitations (
  id uuid not null default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role text not null default 'member',
  department text not null default '',
  token text unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.workspace_invitations is 'Pending email invitations into a workspace.';

-- ─── 4. LINK PROJECTS TO WORKSPACES ─────────────────────────────────────────
-- Nullable so existing rows stay valid during migration. Backfilled in STEP 2.
alter table public.projects
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;


-- ─── 5. SECURITY DEFINER HELPERS (avoid RLS recursion) ──────────────────────
-- These run with the definer's privileges and bypass RLS on the tables they
-- read internally, which prevents infinite recursion when a policy on
-- workspace_members needs to check workspaces (and vice-versa).

create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.user_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.workspace_members
  where user_id = auth.uid();
$$;

create or replace function public.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspaces
    where id = ws and owner_id = auth.uid()
  );
$$;


-- ─── 6. ROW LEVEL SECURITY ──────────────────────────────────────────────────
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;

-- WORKSPACES ----------------------------------------------------------------
drop policy if exists "Members or owner can view workspace" on public.workspaces;
create policy "Members or owner can view workspace"
  on public.workspaces for select
  using (public.is_workspace_member(id) or owner_id = auth.uid());

drop policy if exists "Owner can create workspace" on public.workspaces;
create policy "Owner can create workspace"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

drop policy if exists "Owner can update workspace" on public.workspaces;
create policy "Owner can update workspace"
  on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- WORKSPACE MEMBERS ---------------------------------------------------------
-- SELECT: any member of the same workspace can see the member list.
drop policy if exists "Members can view co-members" on public.workspace_members;
create policy "Members can view co-members"
  on public.workspace_members for select
  using (workspace_id in (select public.user_workspace_ids()));

-- INSERT/UPDATE/DELETE: only the workspace owner manages membership.
-- Uses the SECURITY DEFINER is_workspace_owner() helper to avoid recursion.
drop policy if exists "Owner can add members" on public.workspace_members;
create policy "Owner can add members"
  on public.workspace_members for insert
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists "Owner can update members" on public.workspace_members;
create policy "Owner can update members"
  on public.workspace_members for update
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists "Owner can remove members" on public.workspace_members;
create policy "Owner can remove members"
  on public.workspace_members for delete
  using (public.is_workspace_owner(workspace_id));

-- WORKSPACE INVITATIONS -----------------------------------------------------
-- Only the workspace owner can see / create / update invitations.
drop policy if exists "Owner can view invitations" on public.workspace_invitations;
create policy "Owner can view invitations"
  on public.workspace_invitations for select
  using (public.is_workspace_owner(workspace_id));

drop policy if exists "Owner can create invitations" on public.workspace_invitations;
create policy "Owner can create invitations"
  on public.workspace_invitations for insert
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists "Owner can update invitations" on public.workspace_invitations;
create policy "Owner can update invitations"
  on public.workspace_invitations for update
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));


-- ─── 6b. ACCEPT INVITATION RPC (SECURITY DEFINER) ──────────────────────────
-- Under the policies above, only a workspace owner may insert into
-- workspace_members. An invited (non-owner) user therefore cannot create their
-- own membership row directly. This SECURITY DEFINER function lets an
-- authenticated, invited user accept their invitation safely: it validates the
-- pending invitation (by token, or by the caller's email) and then creates the
-- membership + marks the invitation accepted while bypassing RLS internally.
create or replace function public.accept_workspace_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  uid uuid := auth.uid();
  uemail text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Prefer matching by the one-time token.
  if invite_token is not null and invite_token <> '' then
    select * into inv from public.workspace_invitations
    where token = invite_token and status = 'pending'
    limit 1;
  end if;

  -- Fallback: most recent pending invite for the caller's email.
  if inv.id is null then
    select * into inv from public.workspace_invitations
    where lower(email) = uemail and status = 'pending'
    order by created_at desc
    limit 1;
  end if;

  -- Nothing to accept — let the caller handle this gracefully.
  if inv.id is null then
    return null;
  end if;

  -- Expiry guard.
  if inv.expires_at is not null and inv.expires_at < now() then
    update public.workspace_invitations set status = 'expired' where id = inv.id;
    raise exception 'Invitation expired';
  end if;

  -- Create membership (idempotent).
  insert into public.workspace_members (workspace_id, user_id, role, department, status)
  values (
    inv.workspace_id,
    uid,
    coalesce(nullif(inv.role, ''), 'member'),
    coalesce(inv.department, ''),
    'active'
  )
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invitations set status = 'accepted' where id = inv.id;

  return inv.workspace_id;
end;
$$;

grant execute on function public.accept_workspace_invitation(text) to authenticated;


-- ─── 7. REALTIME ────────────────────────────────────────────────────────────
-- Wrapped in a DO block so re-running doesn't error if already added.
do $$
begin
  begin
    alter publication supabase_realtime add table public.workspace_members;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.workspace_invitations;
  exception when duplicate_object then null;
  end;
end $$;


-- ─── 8. INDEXES ─────────────────────────────────────────────────────────────
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
create index if not exists idx_workspaces_slug on public.workspaces(slug);
create index if not exists idx_workspace_members_ws on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_workspace_invitations_ws on public.workspace_invitations(workspace_id);
create index if not exists idx_workspace_invitations_email on public.workspace_invitations(email);
create index if not exists idx_projects_workspace on public.projects(workspace_id);


-- ============================================================================
-- STEP 2 — DATA MIGRATION  (run AFTER step 1 succeeds)
-- ============================================================================
-- For every existing profile this:
--   1. creates a workspace "{full_name}'s Workspace" with a unique slug,
--   2. sets that profile as owner_id,
--   3. inserts a workspace_members row for the owner with role = 'owner',
--   4. links all of that owner's existing projects to the new workspace.
--
-- Idempotent: skips profiles that already own a workspace, so it is safe to
-- run more than once.
-- ----------------------------------------------------------------------------
-- NOTE: Run this block on its own once you've confirmed STEP 1 created the
-- tables successfully.
-- ============================================================================

do $$
declare
  prof record;
  new_ws_id uuid;
  base_slug text;
  final_slug text;
  suffix int;
begin
  for prof in select id, coalesce(nullif(full_name, ''), 'My') as full_name from public.profiles loop
    -- Skip profiles that already own a workspace (idempotency).
    if exists (select 1 from public.workspaces where owner_id = prof.id) then
      continue;
    end if;

    -- Build a URL-safe base slug from the profile name.
    base_slug := lower(regexp_replace(prof.full_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' or base_slug is null then
      base_slug := 'workspace';
    end if;

    -- Ensure slug uniqueness by appending an incrementing suffix if needed.
    final_slug := base_slug;
    suffix := 1;
    while exists (select 1 from public.workspaces where slug = final_slug) loop
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix::text;
    end loop;

    -- 1 + 2. Create the workspace owned by this profile.
    insert into public.workspaces (name, slug, owner_id)
    values (prof.full_name || '''s Workspace', final_slug, prof.id)
    returning id into new_ws_id;

    -- 3. Add the owner as a member with the 'owner' role.
    insert into public.workspace_members (workspace_id, user_id, role, status)
    values (new_ws_id, prof.id, 'owner', 'active')
    on conflict (workspace_id, user_id) do nothing;

    -- 4. Link this owner's existing projects to the new workspace.
    update public.projects
    set workspace_id = new_ws_id
    where owner_id = prof.id and workspace_id is null;
  end loop;
end $$;

-- ============================================================================
-- END — multi-tenant.sql
-- ============================================================================
