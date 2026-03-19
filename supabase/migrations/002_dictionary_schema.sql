-- ============================================================================
-- DataBridgeAI: Data Dictionary Schema
-- Migration 002: Dictionary tables, indexes, RLS, triggers
-- ============================================================================
-- NOTE: tenants, user_profiles, get_user_tenant_id(), and set_updated_at()
-- already exist from migration 001. Do NOT recreate them.

-- --------------------------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------------------------

create table public.dictionary_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  description text,
  domain_area text,
  owner text,
  display_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_domain_name_per_tenant unique (tenant_id, name)
);

create table public.dictionary_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  field_name text not null,
  field_definition text,
  value_type text not null default 'Text'
    check (value_type in ('Text', 'Long Text', 'Descriptive Text', 'Picklist', 'Concatenated', 'Number')),
  tagging_method text not null default 'AI Inferred'
    check (tagging_method in ('Sourced', 'AI Inferred', 'System')),
  ai_instruction text,
  controlled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  constraint uq_field_name_per_tenant unique (tenant_id, field_name)
);

create table public.dictionary_field_domains (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  domain_id uuid not null references public.dictionary_domains(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  constraint uq_field_domain unique (field_id, domain_id)
);

create table public.dictionary_picklist_values (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  value text not null,
  definition text,
  display_order integer not null default 0,
  constraint uq_picklist_value unique (field_id, value)
);

create table public.dictionary_concatenated_refs (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  referenced_field_id uuid not null references public.dictionary_fields(id),
  tenant_id uuid not null references public.tenants(id),
  position integer not null,
  constraint uq_concat_position unique (field_id, position)
);

create table public.dictionary_match_tables (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  columns text[] not null,
  data jsonb not null default '[]'::jsonb,
  uploaded_at timestamptz default now(),
  constraint uq_match_table_per_field unique (field_id)
);

create table public.dictionary_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  version_number integer not null,
  label text,
  snapshot jsonb not null,
  published_at timestamptz default now(),
  published_by uuid references auth.users(id),
  constraint uq_version_number unique (tenant_id, version_number)
);

-- --------------------------------------------------------------------------
-- 2. Indexes
-- --------------------------------------------------------------------------

create index idx_dict_domains_tenant on public.dictionary_domains(tenant_id);
create index idx_dict_domains_order on public.dictionary_domains(tenant_id, display_order);
create index idx_dict_fields_tenant on public.dictionary_fields(tenant_id);
create index idx_dict_field_domains_field on public.dictionary_field_domains(field_id);
create index idx_dict_field_domains_domain on public.dictionary_field_domains(domain_id);
create index idx_dict_picklist_field on public.dictionary_picklist_values(field_id);
create index idx_dict_concat_field on public.dictionary_concatenated_refs(field_id);
create index idx_dict_match_field on public.dictionary_match_tables(field_id);
create index idx_dict_versions_tenant on public.dictionary_versions(tenant_id);

-- --------------------------------------------------------------------------
-- 3. Row Level Security
-- --------------------------------------------------------------------------

-- dictionary_domains
alter table public.dictionary_domains enable row level security;

create policy "Users can read tenant domains"
  on public.dictionary_domains for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant domains"
  on public.dictionary_domains for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant domains"
  on public.dictionary_domains for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant domains"
  on public.dictionary_domains for delete
  using (tenant_id = public.get_user_tenant_id());

-- dictionary_fields
alter table public.dictionary_fields enable row level security;

create policy "Users can read tenant fields"
  on public.dictionary_fields for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant fields"
  on public.dictionary_fields for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant fields"
  on public.dictionary_fields for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant fields"
  on public.dictionary_fields for delete
  using (tenant_id = public.get_user_tenant_id());

-- dictionary_field_domains
alter table public.dictionary_field_domains enable row level security;

create policy "Users can read tenant field domains"
  on public.dictionary_field_domains for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant field domains"
  on public.dictionary_field_domains for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant field domains"
  on public.dictionary_field_domains for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant field domains"
  on public.dictionary_field_domains for delete
  using (tenant_id = public.get_user_tenant_id());

-- dictionary_picklist_values
alter table public.dictionary_picklist_values enable row level security;

create policy "Users can read tenant picklist values"
  on public.dictionary_picklist_values for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant picklist values"
  on public.dictionary_picklist_values for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant picklist values"
  on public.dictionary_picklist_values for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant picklist values"
  on public.dictionary_picklist_values for delete
  using (tenant_id = public.get_user_tenant_id());

-- dictionary_concatenated_refs
alter table public.dictionary_concatenated_refs enable row level security;

create policy "Users can read tenant concatenated refs"
  on public.dictionary_concatenated_refs for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant concatenated refs"
  on public.dictionary_concatenated_refs for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant concatenated refs"
  on public.dictionary_concatenated_refs for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant concatenated refs"
  on public.dictionary_concatenated_refs for delete
  using (tenant_id = public.get_user_tenant_id());

-- dictionary_match_tables
alter table public.dictionary_match_tables enable row level security;

create policy "Users can read tenant match tables"
  on public.dictionary_match_tables for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant match tables"
  on public.dictionary_match_tables for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant match tables"
  on public.dictionary_match_tables for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant match tables"
  on public.dictionary_match_tables for delete
  using (tenant_id = public.get_user_tenant_id());

-- dictionary_versions
alter table public.dictionary_versions enable row level security;

create policy "Users can read tenant versions"
  on public.dictionary_versions for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can insert tenant versions"
  on public.dictionary_versions for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update tenant versions"
  on public.dictionary_versions for update
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can delete tenant versions"
  on public.dictionary_versions for delete
  using (tenant_id = public.get_user_tenant_id());

-- --------------------------------------------------------------------------
-- 4. Triggers
-- --------------------------------------------------------------------------

create trigger tr_dictionary_domains_updated_at
  before update on public.dictionary_domains
  for each row
  execute function public.set_updated_at();

create trigger tr_dictionary_fields_updated_at
  before update on public.dictionary_fields
  for each row
  execute function public.set_updated_at();
