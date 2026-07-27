# Wave 1 Redesign Plan

Status: proposed, not implemented.

## Wave 1 Goal

Move the public site from mixed page styles to the DS2 record-first structure without losing the strong work already created in Command Center, BOF Vault, Documents, Policies, and dashboard previews.

## Principles

- Shorter pages.
- Fewer repeated CTA bands.
- One primary assessment destination rather than an assessment card at the bottom of every page.
- Every blocked, review, at-risk, held, or exception state must explain:
  - why it exists;
  - who owns it;
  - what record it affects;
  - what clears it;
  - what downstream consequence remains until it is cleared.
- Links should resolve to the relevant record or issue page, not a generic section header.

## Recommended Sequence

1. Header and footer conversion
   - Apply the DS2 header to representative pages first.
   - Confirm wide desktop, tablet, and mobile behavior before broad application.

2. Homepage cleanup
   - Use the cab hero direction only if image crop, text, and face visibility are correct.
   - Remove stale founding-fleet copy where Priority Fleet Program is the current concept.
   - Add direct links to BOF Vault and Documents.

3. Command Center
   - Preserve old-command-center density and issue-specific links.
   - Keep secondary issue pages visually distinct from the main command center.

4. Operations Record
   - Show a concise summary first, then the most relevant active record.
   - Add route-to-clearance logic above alignment tables.

5. Drivers, Dispatch, Safety, Settlements
   - Use the same issue explanation model.
   - Keep roster/queue views compact and expandable.
   - Avoid irrelevant media inside issue cards.

6. Documents and BOF Vault
   - Make these first-class navigation items.
   - Carry over useful old-site document cabinet structure where it improves the current page.

7. Business Operations and Policies
   - Remove repeated narrative sections.
   - Keep only sections that show an operating control, policy, owner, evidence, or clearance path.

## Deferred

- Full dashboard-v2 visual integration.
- Supabase-backed persistence.
- Live write actions.
- Broad replacement of every legacy demo route.

## Acceptance Criteria

- No horizontal header overflow at 1440, 1366, 1280, 768, or 390 px.
- Mobile menu closed by default.
- No generic CTA band repeated across all pages.
- No page links to a broad section when the promise is a specific issue.
- No internal design-note language visible to users.
