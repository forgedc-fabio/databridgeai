-- ============================================================================
-- DataBridgeAI: Ontology Management Schema
-- Migration 001: Core tables, functions, indexes, RLS, triggers, seed data
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------------------------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  created_at timestamptz default now(),
  constraint uq_user_profile unique (user_id)
);

create table public.ontology_relationship_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  is_system boolean default false,
  created_at timestamptz default now(),
  constraint uq_rel_type_name_per_tenant unique (tenant_id, name)
);

create table public.ontology_classes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  description text,
  domain_group text,
  colour text default '#6366f1',
  icon_tag text,
  custom_attributes jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_class_name_per_tenant unique (tenant_id, name)
);

create table public.ontology_relationships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  source_class_id uuid not null references public.ontology_classes(id) on delete cascade,
  target_class_id uuid not null references public.ontology_classes(id) on delete cascade,
  relationship_type_id uuid not null references public.ontology_relationship_types(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_relationship unique (tenant_id, source_class_id, target_class_id, relationship_type_id)
);

create table public.ontology_sync_status (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  last_synced_at timestamptz,
  owl_file_path text,
  sync_status text default 'never_synced',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_sync_per_tenant unique (tenant_id)
);

-- --------------------------------------------------------------------------
-- 2. Functions
-- --------------------------------------------------------------------------

create or replace function public.get_user_tenant_id()
returns uuid
language sql
security definer
stable
as $$
  select tenant_id from public.user_profiles where user_id = auth.uid()
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- 3. Indexes
-- --------------------------------------------------------------------------

create index idx_user_profiles_user_id on public.user_profiles(user_id);
create index idx_ontology_classes_tenant on public.ontology_classes(tenant_id);
create index idx_ontology_relationships_tenant on public.ontology_relationships(tenant_id);
create index idx_ontology_relationships_source on public.ontology_relationships(source_class_id);
create index idx_ontology_relationships_target on public.ontology_relationships(target_class_id);
create index idx_ontology_rel_types_tenant on public.ontology_relationship_types(tenant_id);

-- --------------------------------------------------------------------------
-- 4. Row Level Security
-- --------------------------------------------------------------------------

-- tenants
alter table public.tenants enable row level security;

create policy "Users can read own tenant"
  on public.tenants for select
  using (id = public.get_user_tenant_id());

-- user_profiles
alter table public.user_profiles enable row level security;

create policy "Users can read own profile"
  on public.user_profiles for select
  using (user_id = auth.uid());

create policy "Users can update own profile"
  on public.user_profiles for update
  using (user_id = auth.uid());

-- ontology_classes
alter table public.ontology_classes enable row level security;

create policy "Users can read tenant classes"
  on public.ontology_classes for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant classes"
  on public.ontology_classes for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant classes"
  on public.ontology_classes for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant classes"
  on public.ontology_classes for delete
  using (tenant_id = public.get_user_tenant_id());

-- ontology_relationships
alter table public.ontology_relationships enable row level security;

create policy "Users can read tenant relationships"
  on public.ontology_relationships for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant relationships"
  on public.ontology_relationships for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant relationships"
  on public.ontology_relationships for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant relationships"
  on public.ontology_relationships for delete
  using (tenant_id = public.get_user_tenant_id());

-- ontology_relationship_types
alter table public.ontology_relationship_types enable row level security;

create policy "Users can read tenant relationship types"
  on public.ontology_relationship_types for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant relationship types"
  on public.ontology_relationship_types for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant relationship types"
  on public.ontology_relationship_types for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant relationship types"
  on public.ontology_relationship_types for delete
  using (tenant_id = public.get_user_tenant_id());

-- ontology_sync_status
alter table public.ontology_sync_status enable row level security;

create policy "Users can read tenant sync status"
  on public.ontology_sync_status for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant sync status"
  on public.ontology_sync_status for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant sync status"
  on public.ontology_sync_status for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant sync status"
  on public.ontology_sync_status for delete
  using (tenant_id = public.get_user_tenant_id());

-- --------------------------------------------------------------------------
-- 5. Triggers
-- --------------------------------------------------------------------------

create trigger tr_ontology_classes_updated_at
  before update on public.ontology_classes
  for each row
  execute function public.set_updated_at();

create trigger tr_ontology_relationships_updated_at
  before update on public.ontology_relationships
  for each row
  execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 6. Seed Data
-- --------------------------------------------------------------------------

-- Seed tenant
insert into public.tenants (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Forge DC');

-- Seed user profile for existing authenticated user
-- IMPORTANT: Replace <AUTH_USER_ID> with the actual user ID from auth.users
-- Run: select id from auth.users where email = 'fabio.barboza@forgedc.com';
-- Then uncomment and update the line below:
-- insert into public.user_profiles (user_id, tenant_id) values ('<AUTH_USER_ID>', '00000000-0000-0000-0000-000000000001');

-- Seed system relationship types
insert into public.ontology_relationship_types (tenant_id, name, is_system) values
  ('00000000-0000-0000-0000-000000000001', 'is-a', true),
  ('00000000-0000-0000-0000-000000000001', 'has-part', true),
  ('00000000-0000-0000-0000-000000000001', 'related-to', true),
  ('00000000-0000-0000-0000-000000000001', 'depends-on', true);
