-- BOF public-intake backend schema.
-- Bounded context: public lead/inquiry intake only.
-- Do not reuse MG3 document tables or authenticated fleet workflow tables.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists intake;

create type intake.submission_type as enum (
  'contact',
  'demo_request',
  'priority_fleet',
  'assessment_roadmap',
  'government_inquiry',
  'aggregator_inquiry',
  'driver_inquiry'
);

create type intake.intake_status as enum (
  'new',
  'review_required',
  'assigned',
  'contacted',
  'qualified',
  'not_ready',
  'closed'
);

create type intake.intake_priority as enum (
  'normal',
  'elevated',
  'urgent'
);

create type intake.audience_type as enum (
  'aggregator',
  'private_fleet',
  'for_hire_fleet',
  'government',
  'driver',
  'other'
);

create type intake.fleet_type as enum (
  'private_fleet',
  'for_hire_fleet',
  'government_fleet',
  'carrier_network',
  'owner_operator',
  'other'
);

create type intake.preferred_contact_method as enum (
  'email',
  'phone',
  'either'
);

create type intake.requested_next_step as enum (
  'general_response',
  'guided_demo',
  'detailed_readiness_roadmap',
  'priority_fleet_review',
  'government_consultation',
  'aggregator_consultation',
  'driver_readiness_support'
);

create type intake.assigned_queue as enum (
  'general',
  'demo',
  'priority_fleet',
  'assessment',
  'government',
  'aggregator',
  'driver'
);

create type intake.intake_event_type as enum (
  'submitted',
  'validation_rejected',
  'status_changed',
  'assigned',
  'note_added',
  'notification_requested',
  'notification_pending',
  'notification_sent',
  'notification_failed',
  'notification_unconfigured',
  'closed'
);

create type intake.intake_actor_type as enum (
  'public_submitter',
  'edge_function',
  'internal_user',
  'system'
);

create or replace function intake.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function intake.generate_public_reference()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'BOF-INT-' || upper(encode(extensions.gen_random_bytes(5), 'hex'));
    exit when not exists (
      select 1 from intake.public_intakes where public_reference = candidate
    );
  end loop;
  return candidate;
end;
$$;

create or replace function intake.text_array_items_max_length(values text[], max_length integer)
returns boolean
language sql
immutable
as $$
  select values is null or not exists (
    select 1 from unnest(values) value where char_length(value) > max_length
  );
$$;

create table intake.public_intakes (
  id uuid primary key default extensions.gen_random_uuid(),
  public_reference text not null unique default intake.generate_public_reference(),
  submission_type intake.submission_type not null,
  status intake.intake_status not null default 'new',
  priority intake.intake_priority not null default 'normal',
  source_page text not null,
  source_referrer text,
  source_campaign text,
  audience_type intake.audience_type,
  first_name text not null,
  last_name text not null,
  email text not null,
  normalized_email text not null,
  phone text,
  preferred_contact_method intake.preferred_contact_method,
  organization_name text,
  normalized_organization_name text,
  organization_domain text,
  job_title text,
  fleet_type intake.fleet_type,
  fleet_size_range text,
  operating_regions text[],
  request_summary text,
  requested_next_step intake.requested_next_step,
  assessment_type intake.audience_type,
  assessment_readiness_band text,
  assessment_section_scores jsonb,
  assessment_top_gaps jsonb,
  assessment_recommended_modules jsonb,
  assigned_queue intake.assigned_queue not null,
  assigned_to uuid,
  privacy_acknowledged_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  last_contacted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint public_intakes_reference_format check (public_reference ~ '^BOF-INT-[0-9A-F]{10}$'),
  constraint public_intakes_source_page_length check (char_length(source_page) between 1 and 180 and source_page like '/%'),
  constraint public_intakes_source_referrer_length check (source_referrer is null or char_length(source_referrer) <= 300),
  constraint public_intakes_source_campaign_length check (source_campaign is null or char_length(source_campaign) <= 120),
  constraint public_intakes_first_name_length check (char_length(first_name) between 1 and 80),
  constraint public_intakes_last_name_length check (char_length(last_name) between 1 and 80),
  constraint public_intakes_email_length check (char_length(email) between 3 and 254 and char_length(normalized_email) between 3 and 254),
  constraint public_intakes_email_shape check (normalized_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  constraint public_intakes_phone_length check (phone is null or char_length(phone) <= 40),
  constraint public_intakes_org_length check (organization_name is null or char_length(organization_name) <= 160),
  constraint public_intakes_normalized_org_length check (normalized_organization_name is null or char_length(normalized_organization_name) <= 160),
  constraint public_intakes_org_domain_length check (organization_domain is null or char_length(organization_domain) <= 120),
  constraint public_intakes_job_title_length check (job_title is null or char_length(job_title) <= 120),
  constraint public_intakes_fleet_size_length check (fleet_size_range is null or char_length(fleet_size_range) <= 40),
  constraint public_intakes_operating_regions_limit check (operating_regions is null or array_length(operating_regions, 1) <= 12),
  constraint public_intakes_operating_region_lengths check (intake.text_array_items_max_length(operating_regions, 60)),
  constraint public_intakes_summary_length check (request_summary is null or char_length(request_summary) <= 1500),
  constraint public_intakes_assessment_scores_shape check (
    assessment_section_scores is null or jsonb_typeof(assessment_section_scores) = 'array'
  ),
  constraint public_intakes_assessment_gaps_shape check (
    assessment_top_gaps is null or jsonb_typeof(assessment_top_gaps) = 'array'
  ),
  constraint public_intakes_assessment_modules_shape check (
    assessment_recommended_modules is null or jsonb_typeof(assessment_recommended_modules) = 'array'
  ),
  constraint public_intakes_metadata_shape check (jsonb_typeof(metadata) = 'object'),
  constraint public_intakes_closed_at_status check (status <> 'closed' or closed_at is not null)
);

create table intake.intake_events (
  id uuid primary key default extensions.gen_random_uuid(),
  intake_id uuid references intake.public_intakes(id) on delete cascade,
  event_type intake.intake_event_type not null,
  actor_type intake.intake_actor_type not null,
  actor_id uuid,
  event_summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint intake_events_summary_length check (char_length(event_summary) between 1 and 240),
  constraint intake_events_metadata_shape check (jsonb_typeof(metadata) = 'object')
);

create table intake.intake_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  intake_id uuid not null references intake.public_intakes(id) on delete cascade,
  note_text text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intake_notes_text_length check (char_length(note_text) between 1 and 2000)
);

create table intake.intake_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  intake_id uuid not null references intake.public_intakes(id) on delete cascade,
  assigned_queue intake.assigned_queue not null,
  assigned_to uuid,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  assigned_by uuid,
  constraint intake_assignments_unassigned_after_assigned check (
    unassigned_at is null or unassigned_at >= assigned_at
  )
);

create trigger set_public_intakes_updated_at
before update on intake.public_intakes
for each row execute function intake.set_updated_at();

create trigger set_intake_notes_updated_at
before update on intake.intake_notes
for each row execute function intake.set_updated_at();

create index public_intakes_submitted_at_idx on intake.public_intakes (submitted_at desc);
create index public_intakes_status_idx on intake.public_intakes (status);
create index public_intakes_submission_type_idx on intake.public_intakes (submission_type);
create index public_intakes_audience_type_idx on intake.public_intakes (audience_type);
create index public_intakes_assigned_queue_idx on intake.public_intakes (assigned_queue);
create index public_intakes_normalized_email_idx on intake.public_intakes (normalized_email);
create index public_intakes_organization_domain_idx on intake.public_intakes (organization_domain) where organization_domain is not null;
create index intake_events_intake_id_created_at_idx on intake.intake_events (intake_id, created_at desc);
create index intake_notes_intake_id_created_at_idx on intake.intake_notes (intake_id, created_at desc);
create index intake_assignments_intake_id_assigned_at_idx on intake.intake_assignments (intake_id, assigned_at desc);

alter table intake.public_intakes enable row level security;
alter table intake.intake_events enable row level security;
alter table intake.intake_notes enable row level security;
alter table intake.intake_assignments enable row level security;

revoke all on schema intake from public;
revoke all on all tables in schema intake from public;
revoke all on all functions in schema intake from public;

grant usage on schema intake to service_role;
grant all on all tables in schema intake to service_role;
grant execute on all functions in schema intake to service_role;

grant usage on schema intake to authenticated;
grant select on intake.public_intakes to authenticated;
grant select on intake.intake_events to authenticated;
grant select, insert on intake.intake_notes to authenticated;
grant select on intake.intake_assignments to authenticated;

create policy "bof intake reviewers can read intakes"
on intake.public_intakes
for select
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ?| array['bof_intake_reviewer', 'bof_admin'], false)
);

create policy "bof intake reviewers can read events"
on intake.intake_events
for select
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ?| array['bof_intake_reviewer', 'bof_admin'], false)
);

create policy "bof intake reviewers can read notes"
on intake.intake_notes
for select
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ?| array['bof_intake_reviewer', 'bof_admin'], false)
);

create policy "bof intake reviewers can add notes"
on intake.intake_notes
for insert
to authenticated
with check (
  coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ?| array['bof_intake_reviewer', 'bof_admin'], false)
);

create policy "bof intake reviewers can read assignments"
on intake.intake_assignments
for select
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ?| array['bof_intake_reviewer', 'bof_admin'], false)
);

comment on schema intake is 'BOF public lead and inquiry intake only. Excludes MG3 documents, uploads, authenticated portal records, production chat, payments, and protected records.';
comment on table intake.public_intakes is 'Server-side public-intake records inserted only by secure functions using service-role secrets.';
comment on table intake.intake_events is 'Minimal operational event log. Do not store secrets, raw request bodies, or protected documents.';
