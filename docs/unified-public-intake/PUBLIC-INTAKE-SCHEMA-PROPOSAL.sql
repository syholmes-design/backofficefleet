-- Proposal only. Do not apply without owner/backend approval, target Supabase project
-- confirmation, RLS review, retention approval, and deployment plan.

create table public.public_intakes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  intake_type text not null check (
    intake_type in (
      'contact',
      'demo_request',
      'priority_fleet',
      'assessment_roadmap',
      'government_inquiry',
      'aggregator_inquiry',
      'driver_inquiry'
    )
  ),
  source_page text not null,
  status text not null default 'new' check (
    status in ('new', 'reviewing', 'routed', 'closed', 'spam', 'deleted')
  ),
  contact jsonb not null,
  organization jsonb not null,
  request jsonb not null,
  assessment_context jsonb,
  privacy_acknowledgment boolean not null default false,
  reviewer_notes text,
  routed_to text,
  retention_delete_after date
);

alter table public.public_intakes enable row level security;

-- Policies must be finalized against the selected backend auth model.
-- Public anonymous inserts should only be allowed through a validated server endpoint,
-- not direct browser writes to Supabase.
