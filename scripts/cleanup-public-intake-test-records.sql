-- Development cleanup helper for approved test records only.
-- Do not run against production. Requires explicit reviewer confirmation.

begin;

-- Review candidate records first.
select
  id,
  public_reference,
  submission_type,
  submitted_at,
  normalized_email,
  metadata ->> 'test_submission' as test_submission
from intake.public_intakes
where metadata ->> 'test_submission' = 'true'
order by submitted_at desc;

-- Uncomment only after confirming the selected project is development/test.
-- delete from intake.public_intakes
-- where metadata ->> 'test_submission' = 'true';

rollback;
