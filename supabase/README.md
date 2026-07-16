# BOF Supabase MVP Setup

This folder starts the BOF Command Center data move from static JSON to Supabase.

## Current Frontend Values

The static website now has a frontend-safe config at:

`Website/assets/js/bof-supabase-config.js`

It uses:

- Project URL: `https://cluqatmyytcowkyilzrz.supabase.co`
- Publishable key only

Do not place the secret key in the Website folder.

## Step 1: Create The Starter Table

In Supabase:

1. Open the BOF project.
2. Go to SQL Editor.
3. Paste and run `supabase/bof_mvp_schema.sql`.

This creates `public.bof_public_operations_dataset` with RLS enabled.

## Step 2: Seed The Current Demo Dataset

The site currently falls back to:

`Website/assets/data/bof-public-operations.json`

To make Supabase the live data source, insert one row into:

`public.bof_public_operations_dataset`

Use:

- `id`: `current`
- `payload`: the full JSON from `Website/assets/data/bof-public-operations.json`

Once that row exists, the public pages will try Supabase first and fall back to local JSON if Supabase is unavailable.

## Step 3: Next MVP Move

After the single dataset row works, split the payload into normalized tables:

- carriers
- drivers
- driver carrier assignments
- document rules
- carrier policy overlays
- driver pay profiles
- loads
- settlements
- safety records
- clearance tasks
- policy documents
- file evidence
- audit log

Keep RLS enabled before any real driver, customer, carrier, payroll, or private business data is added.
