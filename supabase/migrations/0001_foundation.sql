-- supabase/migrations/0001_foundation.sql

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (agency_id, user_id)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee_id uuid references agency_members(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Função central de checagem de pertencimento, usada por todas as policies.
create function is_agency_member(check_agency_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from agency_members
    where agency_id = check_agency_id
      and user_id = auth.uid()
  );
$$;

alter table agencies enable row level security;
alter table agency_members enable row level security;
alter table clients enable row level security;
alter table tasks enable row level security;

create policy "members can read own agency" on agencies
  for select using (is_agency_member(id));

create policy "members can read own membership rows" on agency_members
  for select using (is_agency_member(agency_id));

create policy "members can read clients" on clients
  for select using (is_agency_member(agency_id));
create policy "members can insert clients" on clients
  for insert with check (is_agency_member(agency_id));
create policy "members can update clients" on clients
  for update using (is_agency_member(agency_id)) with check (is_agency_member(agency_id));
create policy "members can delete clients" on clients
  for delete using (is_agency_member(agency_id));

create policy "members can read tasks" on tasks
  for select using (is_agency_member(agency_id));
create policy "members can insert tasks" on tasks
  for insert with check (is_agency_member(agency_id));
create policy "members can update tasks" on tasks
  for update using (is_agency_member(agency_id)) with check (is_agency_member(agency_id));
create policy "members can delete tasks" on tasks
  for delete using (is_agency_member(agency_id));

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on tasks
  for each row
  execute function set_updated_at();
