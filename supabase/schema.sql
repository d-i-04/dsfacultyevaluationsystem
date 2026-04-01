-- Supabase schema for Faculty Evaluation starter
-- Run this in the Supabase SQL editor. Adjust policies as you finalize auth roles.

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type app_role as enum ('admin', 'faculty', 'student', 'evaluator');
create type evaluation_role as enum ('self', 'peer', 'supervisor', 'student');
create type period_status as enum ('draft', 'open', 'closed');
create type evaluation_status as enum ('draft', 'submitted');
create type sentiment_scale as enum ('positive', 'neutral', 'negative');

-- Helper to read JWT role (expects app_metadata.role to be embedded in JWT)
create or replace function app_is_admin() returns boolean as $$
  select coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') = 'admin';
$$ language sql stable;

-- Departments
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Profiles (link to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text unique,
  role app_role not null default 'faculty',
  department_id uuid references departments(id),
  created_at timestamptz not null default now()
);

-- Courses and sections
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  department_id uuid references departments(id),
  created_at timestamptz not null default now(),
  unique(code)
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  faculty_id uuid references profiles(id),
  term text,
  academic_year text,
  schedule text,
  created_at timestamptz not null default now()
);

-- Evaluation period and rubric
create table if not exists evaluation_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  status period_status not null default 'draft',
  rubric_version text,
  created_at timestamptz not null default now()
);

create table if not exists rubric_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  order_index integer not null default 0,
  weight numeric(6,2) not null default 1.0,
  created_at timestamptz not null default now()
);

create table if not exists rubric_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references rubric_categories(id) on delete cascade,
  prompt text not null,
  max_score integer not null default 5,
  order_index integer not null default 0,
  weight numeric(6,2) not null default 1.0,
  created_at timestamptz not null default now()
);

-- Assign evaluators per faculty/section/period
create table if not exists evaluator_assignments (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references evaluation_periods(id) on delete cascade,
  section_id uuid references sections(id),
  faculty_id uuid not null references profiles(id),
  evaluator_id uuid not null references profiles(id),
  role evaluation_role not null,
  created_at timestamptz not null default now(),
  unique(period_id, section_id, faculty_id, evaluator_id, role)
);

-- Evaluations and responses
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references evaluator_assignments(id) on delete cascade,
  status evaluation_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  overall_comment text
);

create table if not exists evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  rubric_item_id uuid not null references rubric_items(id),
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(evaluation_id, rubric_item_id)
);

-- Student sentiment / notes
create table if not exists student_sentiments (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references evaluation_periods(id),
  section_id uuid references sections(id),
  faculty_id uuid references profiles(id),
  student_id uuid references profiles(id),
  sentiment sentiment_scale not null default 'positive',
  comments text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table departments enable row level security;
alter table profiles enable row level security;
alter table courses enable row level security;
alter table sections enable row level security;
alter table evaluation_periods enable row level security;
alter table rubric_categories enable row level security;
alter table rubric_items enable row level security;
alter table evaluator_assignments enable row level security;
alter table evaluations enable row level security;
alter table evaluation_responses enable row level security;
alter table student_sentiments enable row level security;

-- Basic policies (starter; adjust to your needs)
-- Public read for authenticated users on reference data
do $$ begin
  execute 'create policy read_departments on departments for select using (auth.role() = ''authenticated'')';
  execute 'create policy read_courses on courses for select using (auth.role() = ''authenticated'')';
  execute 'create policy read_rubric_categories on rubric_categories for select using (auth.role() = ''authenticated'')';
  execute 'create policy read_rubric_items on rubric_items for select using (auth.role() = ''authenticated'')';
end $$;

-- Profiles: users can see themselves; admins see all
do $$ begin
  execute 'create policy self_profile on profiles for select using (auth.uid() = id or app_is_admin())';
  execute 'create policy self_profile_update on profiles for update using (auth.uid() = id or app_is_admin())';
end $$;

-- Admin-only writes to reference tables
do $$ begin
  execute 'create policy admin_write_departments on departments for all using (app_is_admin()) with check (app_is_admin())';
  execute 'create policy admin_write_courses on courses for all using (app_is_admin()) with check (app_is_admin())';
  execute 'create policy admin_write_rubric_categories on rubric_categories for all using (app_is_admin()) with check (app_is_admin())';
  execute 'create policy admin_write_rubric_items on rubric_items for all using (app_is_admin()) with check (app_is_admin())';
  execute 'create policy admin_write_periods on evaluation_periods for all using (app_is_admin()) with check (app_is_admin())';
end $$;

-- Sections: readable to authenticated; writable by admin
create policy select_sections on sections for select using (auth.role() = 'authenticated');
create policy admin_write_sections on sections for all using (app_is_admin()) with check (app_is_admin());

-- Assignments and evaluations: evaluator can see/insert their own
create policy select_assignments on evaluator_assignments for select using (
  auth.uid() = evaluator_id or app_is_admin()
);
create policy insert_assignments_admin on evaluator_assignments for insert with check (app_is_admin());
create policy update_assignments_admin on evaluator_assignments for update using (app_is_admin()) with check (app_is_admin());

create policy select_evaluations on evaluations for select using (
  exists (
    select 1 from evaluator_assignments ea
    where ea.id = evaluations.assignment_id
      and (ea.evaluator_id = auth.uid() or app_is_admin())
  )
);
create policy insert_evaluations on evaluations for insert with check (
  exists (
    select 1 from evaluator_assignments ea
    where ea.id = assignment_id and ea.evaluator_id = auth.uid()
  ) or app_is_admin()
);

create policy select_eval_responses on evaluation_responses for select using (
  exists (
    select 1 from evaluations e
    join evaluator_assignments ea on ea.id = e.assignment_id
    where e.id = evaluation_responses.evaluation_id
      and (ea.evaluator_id = auth.uid() or app_is_admin())
  )
);
create policy insert_eval_responses on evaluation_responses for insert with check (
  exists (
    select 1 from evaluations e
    join evaluator_assignments ea on ea.id = e.assignment_id
    where e.id = evaluation_id and ea.evaluator_id = auth.uid()
  ) or app_is_admin()
);

-- Student sentiments: any authenticated user can insert; admins read all; faculty read those about them
create policy insert_student_sentiment on student_sentiments for insert with check (auth.role() = 'authenticated');
create policy select_student_sentiment on student_sentiments for select using (
  app_is_admin() or faculty_id = auth.uid() or student_id = auth.uid()
);

-- Seed rubric categories (NBC No. 461)
insert into rubric_categories (id, label, description, order_index, weight) values
  (gen_random_uuid(), 'Commitment', 'Sensitivity, availability, records, timeliness', 1, 1.0),
  (gen_random_uuid(), 'Knowledge of Subject', 'Mastery, relevance, currency', 2, 1.0),
  (gen_random_uuid(), 'Teaching for Independent Learning', 'Strategies, self-esteem, accountability, beyond requirements', 3, 1.0),
  (gen_random_uuid(), 'Management of Learning', 'Facilitation, experience design, structure, materials', 4, 1.0)
  on conflict do nothing;

-- Add rubric items manually or via UI after import. Example inserts (commented):
-- insert into rubric_items (category_id, prompt, order_index) values
--   ('<category_id_commitment>', 'Demonstrates sensitivity to students'' ability to attend and absorb content information.', 1),
--   ('<category_id_commitment>', 'Integrates sensitively learning objectives with those of students in a collaborative process.', 2);

-- Indexes for performance
create index if not exists idx_sections_course on sections(course_id);
create index if not exists idx_assignments_faculty on evaluator_assignments(faculty_id);
create index if not exists idx_assignments_evaluator on evaluator_assignments(evaluator_id);
create index if not exists idx_eval_responses_eval on evaluation_responses(evaluation_id);
create index if not exists idx_student_sentiment_faculty on student_sentiments(faculty_id);
