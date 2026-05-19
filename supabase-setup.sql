-- =========================================================
-- Tuition Master — Supabase PostgreSQL Setup
-- Run this file in Supabase Dashboard > SQL Editor > New query
-- After running, update app_settings.admin_emails with your real admin email.
-- =========================================================

begin;

create extension if not exists pgcrypto;

-- -------------------------
-- App settings
-- -------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('admin_emails', '["your-admin-email@example.com"]'::jsonb)
on conflict (key) do nothing;

-- Change this after first run:
-- update public.app_settings
-- set value = '["your-real-admin-email@gmail.com"]'::jsonb
-- where key = 'admin_emails';

-- -------------------------
-- Utility functions
-- -------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select value ? coalesce(auth.jwt() ->> 'email', '')
      from public.app_settings
      where key = 'admin_emails'
    ),
    false
  );
$$;

-- -------------------------
-- Core tables
-- -------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null default 'New User',
  phone text,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  district text,
  upazila text,
  subjects text[] not null default '{}'::text[],
  class_levels text[] not null default '{}'::text[],
  qualification text,
  experience_years integer not null default 0 check (experience_years >= 0),
  fee_monthly numeric(12,2) not null default 0 check (fee_monthly >= 0),
  bio text,
  availability text,
  avatar_url text,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  total_reviews integer not null default 0 check (total_reviews >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tuition_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null,
  subject text not null,
  class_level text not null,
  schedule_note text,
  monthly_fee numeric(12,2) not null default 0 check (monthly_fee >= 0),
  student_service_fee numeric(12,2) not null default 0 check (student_service_fee >= 0),
  student_service_fee_rate numeric(5,4) not null default 0.10,
  teacher_commission_rate numeric(5,4) not null default 0.20,
  bkash_trx_id text,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'payment_submitted', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tuition_requests_student_id_fkey foreign key (student_id) references public.profiles(id) on delete cascade,
  constraint tuition_requests_teacher_id_fkey foreign key (teacher_id) references public.profiles(id) on delete cascade
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.tuition_requests(id) on delete set null,
  payer_id uuid not null references public.profiles(id) on delete cascade,
  payment_type text not null check (payment_type in ('student_service_fee', 'teacher_monthly_commission', 'other')),
  method text not null default 'bkash' check (method in ('bkash', 'nagad', 'rocket', 'cash', 'bank')),
  trx_id text,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tuition_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'voice', 'file')),
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.tuition_requests(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.tuition_requests(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  class_date date not null,
  status text not null default 'present' check (status in ('present', 'absent', 'late')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.tuition_requests(id) on delete cascade,
  title text not null,
  subject text,
  file_url text not null,
  file_path text,
  file_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tuition_requests(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id, student_id)
);

-- -------------------------
-- Relationship helper functions
-- -------------------------
create or replace function public.has_profile_connection(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.uid() = profile_id, false)
    or public.is_admin()
    or exists (
      select 1
      from public.tuition_requests tr
      where (tr.student_id = auth.uid() or tr.teacher_id = auth.uid())
        and (tr.student_id = profile_id or tr.teacher_id = profile_id)
    );
$$;

create or replace function public.has_request_access(request_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.tuition_requests tr
      where tr.id = request_uuid
        and (tr.student_id = auth.uid() or tr.teacher_id = auth.uid())
    );
$$;

-- -------------------------
-- Automatic profile creation after signup
-- -------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status, verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'New User'),
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    case when coalesce(new.raw_user_meta_data ->> 'role', 'student') = 'teacher' then 'pending' else 'approved' end,
    case when coalesce(new.raw_user_meta_data ->> 'role', 'student') = 'teacher' then false else true end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------
-- Updated_at triggers
-- -------------------------
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_tuition_requests_updated_at on public.tuition_requests;
create trigger trg_tuition_requests_updated_at before update on public.tuition_requests for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

drop trigger if exists trg_schedules_updated_at on public.schedules;
create trigger trg_schedules_updated_at before update on public.schedules for each row execute function public.set_updated_at();

drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at before update on public.attendance for each row execute function public.set_updated_at();

drop trigger if exists trg_materials_updated_at on public.materials;
create trigger trg_materials_updated_at before update on public.materials for each row execute function public.set_updated_at();

-- -------------------------
-- Indexes
-- -------------------------
create index if not exists idx_profiles_role_status on public.profiles(role, status);
create index if not exists idx_profiles_district on public.profiles(district);
create index if not exists idx_profiles_subjects on public.profiles using gin(subjects);
create index if not exists idx_profiles_class_levels on public.profiles using gin(class_levels);
create index if not exists idx_tuition_requests_student on public.tuition_requests(student_id);
create index if not exists idx_tuition_requests_teacher on public.tuition_requests(teacher_id);
create index if not exists idx_tuition_requests_status on public.tuition_requests(status);
create index if not exists idx_payments_request on public.payments(request_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_messages_request_created on public.messages(request_id, created_at);
create index if not exists idx_schedules_start on public.schedules(start_at);
create index if not exists idx_attendance_date on public.attendance(class_date);

-- -------------------------
-- Enable Row Level Security
-- -------------------------
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.tuition_requests enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.schedules enable row level security;
alter table public.attendance enable row level security;
alter table public.materials enable row level security;
alter table public.teacher_reviews enable row level security;

-- -------------------------
-- RLS policies: app_settings
-- -------------------------
drop policy if exists "tm_app_settings_select" on public.app_settings;
create policy "tm_app_settings_select" on public.app_settings
for select to authenticated
using (public.is_admin());

drop policy if exists "tm_app_settings_update" on public.app_settings;
create policy "tm_app_settings_update" on public.app_settings
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- -------------------------
-- RLS policies: profiles
-- -------------------------
drop policy if exists "tm_profiles_select" on public.profiles;
create policy "tm_profiles_select" on public.profiles
for select
using (
  public.is_admin()
  or id = auth.uid()
  or (role = 'teacher' and status = 'approved' and verified = true)
  or public.has_profile_connection(id)
);

drop policy if exists "tm_profiles_insert" on public.profiles;
create policy "tm_profiles_insert" on public.profiles
for insert to authenticated
with check (id = auth.uid() and role <> 'admin');

drop policy if exists "tm_profiles_update" on public.profiles;
create policy "tm_profiles_update" on public.profiles
for update to authenticated
using (public.is_admin() or id = auth.uid())
with check (public.is_admin() or (id = auth.uid() and role <> 'admin'));

-- -------------------------
-- RLS policies: tuition_requests
-- -------------------------
drop policy if exists "tm_requests_select" on public.tuition_requests;
create policy "tm_requests_select" on public.tuition_requests
for select to authenticated
using (public.is_admin() or student_id = auth.uid() or teacher_id = auth.uid());

drop policy if exists "tm_requests_insert" on public.tuition_requests;
create policy "tm_requests_insert" on public.tuition_requests
for insert to authenticated
with check (student_id = auth.uid());

drop policy if exists "tm_requests_update" on public.tuition_requests;
create policy "tm_requests_update" on public.tuition_requests
for update to authenticated
using (public.is_admin() or student_id = auth.uid() or teacher_id = auth.uid())
with check (public.is_admin() or student_id = auth.uid() or teacher_id = auth.uid());

-- -------------------------
-- RLS policies: payments
-- -------------------------
drop policy if exists "tm_payments_select" on public.payments;
create policy "tm_payments_select" on public.payments
for select to authenticated
using (
  public.is_admin()
  or payer_id = auth.uid()
  or (request_id is not null and public.has_request_access(request_id))
);

drop policy if exists "tm_payments_insert" on public.payments;
create policy "tm_payments_insert" on public.payments
for insert to authenticated
with check (public.is_admin() or payer_id = auth.uid());

drop policy if exists "tm_payments_update" on public.payments;
create policy "tm_payments_update" on public.payments
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- -------------------------
-- RLS policies: messages
-- -------------------------
drop policy if exists "tm_messages_select" on public.messages;
create policy "tm_messages_select" on public.messages
for select to authenticated
using (public.is_admin() or sender_id = auth.uid() or receiver_id = auth.uid() or public.has_request_access(request_id));

drop policy if exists "tm_messages_insert" on public.messages;
create policy "tm_messages_insert" on public.messages
for insert to authenticated
with check (sender_id = auth.uid() and public.has_request_access(request_id));

drop policy if exists "tm_messages_update" on public.messages;
create policy "tm_messages_update" on public.messages
for update to authenticated
using (receiver_id = auth.uid() or public.is_admin())
with check (receiver_id = auth.uid() or public.is_admin());

-- -------------------------
-- RLS policies: schedules
-- -------------------------
drop policy if exists "tm_schedules_select" on public.schedules;
create policy "tm_schedules_select" on public.schedules
for select to authenticated
using (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid() or (request_id is not null and public.has_request_access(request_id)));

drop policy if exists "tm_schedules_insert" on public.schedules;
create policy "tm_schedules_insert" on public.schedules
for insert to authenticated
with check (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid() or (request_id is not null and public.has_request_access(request_id)));

drop policy if exists "tm_schedules_update" on public.schedules;
create policy "tm_schedules_update" on public.schedules
for update to authenticated
using (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid())
with check (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid());

-- -------------------------
-- RLS policies: attendance
-- -------------------------
drop policy if exists "tm_attendance_select" on public.attendance;
create policy "tm_attendance_select" on public.attendance
for select to authenticated
using (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid() or (request_id is not null and public.has_request_access(request_id)));

drop policy if exists "tm_attendance_insert" on public.attendance;
create policy "tm_attendance_insert" on public.attendance
for insert to authenticated
with check (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid() or (request_id is not null and public.has_request_access(request_id)));

drop policy if exists "tm_attendance_update" on public.attendance;
create policy "tm_attendance_update" on public.attendance
for update to authenticated
using (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid())
with check (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid());

-- -------------------------
-- RLS policies: materials
-- -------------------------
drop policy if exists "tm_materials_select" on public.materials;
create policy "tm_materials_select" on public.materials
for select to authenticated
using (public.is_admin() or owner_id = auth.uid() or (request_id is not null and public.has_request_access(request_id)));

drop policy if exists "tm_materials_insert" on public.materials;
create policy "tm_materials_insert" on public.materials
for insert to authenticated
with check (public.is_admin() or owner_id = auth.uid());

drop policy if exists "tm_materials_update" on public.materials;
create policy "tm_materials_update" on public.materials
for update to authenticated
using (public.is_admin() or owner_id = auth.uid())
with check (public.is_admin() or owner_id = auth.uid());

-- -------------------------
-- RLS policies: reviews
-- -------------------------
drop policy if exists "tm_reviews_select" on public.teacher_reviews;
create policy "tm_reviews_select" on public.teacher_reviews
for select
using (public.is_admin() or teacher_id = auth.uid() or student_id = auth.uid() or exists (select 1 from public.profiles p where p.id = teacher_id and p.status = 'approved'));

drop policy if exists "tm_reviews_insert" on public.teacher_reviews;
create policy "tm_reviews_insert" on public.teacher_reviews
for insert to authenticated
with check (student_id = auth.uid() and public.has_request_access(request_id));

-- -------------------------
-- Storage bucket for study materials
-- -------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  true,
  52428800,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'text/plain']
)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tm_storage_materials_select" on storage.objects;
create policy "tm_storage_materials_select" on storage.objects
for select
using (bucket_id = 'materials');

drop policy if exists "tm_storage_materials_insert" on storage.objects;
create policy "tm_storage_materials_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'materials');

-- -------------------------
-- Realtime publication
-- -------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tuition_requests;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.schedules;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.attendance;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.materials;
exception when duplicate_object then null;
end $$;

commit;

-- =========================================================
-- Optional: promote a signed-up user to admin profile
-- Run after the admin has created an account:
-- update public.profiles set role = 'admin', status = 'approved', verified = true where email = 'your-real-admin-email@gmail.com';
-- =========================================================


-- Notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Weather cache table
create table if not exists weather_logs (
  id bigint generated always as identity primary key,
  location_name text,
  temperature numeric,
  humidity numeric,
  created_at timestamptz default now()
);
