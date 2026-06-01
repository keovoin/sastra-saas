-- ============================================================================
-- URGENT FIX: RLS Infinite Recursion on profiles table
-- ============================================================================
-- PROBLEM: The "Superadmins can view all profiles" policy queried the profiles
-- table from within a profiles policy, causing infinite recursion. This broke
-- ALL profile reads → app shows "???" and can't load any data.
--
-- RUN THIS ENTIRE SCRIPT in Supabase SQL Editor to fix it.
-- ============================================================================

-- 1. Drop the broken recursive policies
drop policy if exists "Superadmins can view all profiles" on public.profiles;
drop policy if exists "Superadmins can update all profiles" on public.profiles;
drop policy if exists "Superadmins can view all projects" on public.projects;
drop policy if exists "Superadmins can update all projects" on public.projects;
drop policy if exists "Superadmins can view billing events" on public.billing_events;
drop policy if exists "Superadmins can view audit log" on public.admin_audit_log;
drop policy if exists "Superadmins can insert audit log" on public.admin_audit_log;

-- 2. Create a SECURITY DEFINER function that checks superadmin WITHOUT triggering RLS
--    (SECURITY DEFINER bypasses RLS on the queried table, preventing recursion)
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_superadmin from public.profiles where id = auth.uid()), false);
$$;

-- 3. Recreate the policies using the function (no recursion)
create policy "Superadmins can view all profiles" on public.profiles for select
  using (public.is_superadmin());

create policy "Superadmins can update all profiles" on public.profiles for update
  using (public.is_superadmin());

create policy "Superadmins can view all projects" on public.projects for select
  using (public.is_superadmin());

create policy "Superadmins can update all projects" on public.projects for update
  using (public.is_superadmin());

create policy "Superadmins can view billing events" on public.billing_events for select
  using (public.is_superadmin());

create policy "Superadmins can view audit log" on public.admin_audit_log for select
  using (public.is_superadmin());

create policy "Superadmins can insert audit log" on public.admin_audit_log for insert
  with check (public.is_superadmin());

-- 4. Grant yourself superadmin (replace with YOUR login email)
update public.profiles set is_superadmin = true
where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');

-- 5. Verify
select u.email, p.is_superadmin, p.full_name
from public.profiles p
join auth.users u on u.id = p.id
where p.is_superadmin = true;

-- ============================================================================
-- After running this, hard-refresh your app (Ctrl+Shift+R).
-- The "???" should be gone and /admin should work.
-- ============================================================================
