# Contact and Organization Reconciliation

## Goals

- Preserve every submission as its own intake event.
- Associate repeat submissions internally where safe.
- Do not overwrite prior submissions.
- Do not expose whether an email already exists.
- Do not reveal internal IDs.
- Avoid unsafe automatic merging based only on names.

## Matching Signals

High-confidence:

- normalized email exact match

Medium-confidence:

- normalized phone exact match
- same organization domain plus similar organization name

Low-confidence:

- similar personal name only
- similar organization name only

## Rules

1. Always create a new `public_intakes` event.
2. Generate a private candidate match set after validation.
3. Auto-associate exact normalized email matches to an internal person cluster.
4. Do not auto-merge based only on name.
5. Flag medium-confidence matches for internal review.
6. Do not change the visitor-facing response based on match state.
7. Store normalized matching values or hashes server-side only.

## Visitor Privacy

The public response should say only that the request was received if a real backend is available. It must not say “welcome back,” “we found your organization,” or anything that confirms an existing record.
