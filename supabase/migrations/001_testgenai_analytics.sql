create extension if not exists pgcrypto;

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text,
  language text,
  file_size bigint,
  upload_timestamp timestamptz not null default now(),
  repository_name text,
  source_type text,
  analysis_completed boolean not null default false,
  test_generation_completed boolean not null default false,
  execution_completed boolean not null default false,
  coverage_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  function_count integer not null default 0,
  class_count integer not null default 0,
  import_count integer not null default 0,
  dependency_count integer not null default 0,
  functions_json jsonb not null default '[]'::jsonb,
  classes_json jsonb not null default '[]'::jsonb,
  imports_json jsonb not null default '[]'::jsonb,
  dependencies_json jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.semantic_test_cases (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  provider text,
  model text,
  function_name text not null,
  signature text,
  unit_tests_json jsonb not null default '[]'::jsonb,
  negative_tests_json jsonb not null default '[]'::jsonb,
  edge_cases_json jsonb not null default '[]'::jsonb,
  boundary_cases_json jsonb not null default '[]'::jsonb,
  potential_logic_issues_json jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.generated_pytest_artifacts (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  artifact_name text not null,
  artifact_type text not null,
  artifact_content text not null,
  generated_at timestamptz not null default now()
);

create table if not exists public.executions (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  execution_timestamp timestamptz not null default now(),
  status text not null,
  total_tests integer not null default 0,
  passed_tests integer not null default 0,
  failed_tests integer not null default 0,
  pass_rate numeric(6, 2) not null default 0,
  execution_time text,
  logs_json jsonb not null default '[]'::jsonb
);

create table if not exists public.execution_details (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.executions(id) on delete cascade,
  test_name text not null,
  status text not null,
  expected_output text,
  actual_output text,
  failure_reason text,
  duration text
);

create table if not exists public.coverage_reports (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  coverage_percent numeric(6, 2) not null default 0,
  functions_covered integer not null default 0,
  functions_missing text[] not null default '{}',
  coverage_summary text,
  coverage_json jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.user_story_sessions (
  id uuid primary key default gen_random_uuid(),
  story_text text not null,
  provider text,
  model text,
  business_rules_json jsonb not null default '[]'::jsonb,
  positive_tests_json jsonb not null default '[]'::jsonb,
  negative_tests_json jsonb not null default '[]'::jsonb,
  edge_cases_json jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.project_metrics (
  id uuid primary key default gen_random_uuid(),
  total_uploaded_files integer not null default 0,
  total_executions integer not null default 0,
  total_tests_generated integer not null default 0,
  total_tests_passed integer not null default 0,
  total_tests_failed integer not null default 0,
  average_pass_rate numeric(6, 2) not null default 0,
  average_coverage numeric(6, 2) not null default 0,
  last_updated timestamptz not null default now()
);

create index if not exists idx_uploaded_files_uploaded_at on public.uploaded_files(upload_timestamp desc);
create index if not exists idx_uploaded_files_name_time on public.uploaded_files(file_name, upload_timestamp desc);
create index if not exists idx_analysis_results_file on public.analysis_results(uploaded_file_id, generated_at desc);
create index if not exists idx_semantic_test_cases_file on public.semantic_test_cases(uploaded_file_id, generated_at desc);
create index if not exists idx_pytest_artifacts_file on public.generated_pytest_artifacts(uploaded_file_id, generated_at desc);
create index if not exists idx_executions_file_time on public.executions(uploaded_file_id, execution_timestamp desc);
create index if not exists idx_executions_status on public.executions(status);
create index if not exists idx_execution_details_execution on public.execution_details(execution_id);
create index if not exists idx_coverage_reports_file_time on public.coverage_reports(uploaded_file_id, generated_at desc);
create index if not exists idx_user_story_sessions_generated_at on public.user_story_sessions(generated_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_uploaded_files_updated_at on public.uploaded_files;
create trigger trg_uploaded_files_updated_at
before update on public.uploaded_files
for each row execute function public.set_updated_at();

create or replace view public.provider_usage as
select provider, model, count(*) as generated_items
from public.semantic_test_cases
group by provider, model
union all
select provider, model, count(*) as generated_items
from public.user_story_sessions
group by provider, model;

insert into public.project_metrics (id)
select '00000000-0000-0000-0000-000000000001'::uuid
where not exists (
  select 1 from public.project_metrics where id = '00000000-0000-0000-0000-000000000001'::uuid
);
