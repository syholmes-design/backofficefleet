# Provision a production operator

A person who already has legitimate access to the production Postgres database may run this tool. It is not a public endpoint and it does not create a fleet, a role, or a demo user. Development tooling has not executed this command against production.

The authorized operator supplies `DATABASE_URL` in the runtime environment. The tool reads that value only. It does not load repository env files, does not read Vercel, and does not print the connection string. No password and no password hash are stored in the repository.

## Commands

Dry run is the default. It validates and prints the fleet and the intended record changes. It writes nothing.

```text
npm run provision:operator -- --dry-run
```

A write requires `--execute` and the exact phrase `PROVISION PRODUCTION OPERATOR`. `yes` is not accepted.

```text
npm run provision:operator -- --execute
```

The terminal must be interactive. A piped password is refused.

## Prompts

The tool asks for:

- operator email
- operator name, which may be left blank
- password, typed into a hidden prompt
- the id of an existing fleet

The password cannot be passed as a command-line argument. The prompt does not echo it, and the tool does not write it to a file or a log. The database write receives only the bcrypt hash.

This CLI provisions only `FLEET_OPERATIONS`. It does not provision `DISPATCH`, `FLEET_ADMIN`, `FLEET_MANAGER`, `BOF_OPERATIONS`, or `BOF_COMPLIANCE_REVIEW`. Application authorization is unchanged. If the `FLEET_OPERATIONS` role row is missing, the tool stops. It does not create roles.

The fleet must already exist and have status `ACTIVE`. The tool prints the fleet id, slug, and name before any write. Fleet has no separate demo classification field. Confirm the slug and name are the live fleet. The tool does not create or modify fleets.

## Existing records

If the email belongs to a user linked from a driver record, the tool stops. Choose a different email.

If the user already exists, the password is left unchanged unless you type `ROTATE OPERATOR PASSWORD`. An inactive or suspended user is activated only after `ACTIVATE OPERATOR USER`. An invited or inactive membership is activated only after `ACTIVATE OPERATOR MEMBERSHIP`. A membership that already has another role is changed to `FLEET_OPERATIONS` only after `CHANGE OPERATOR ROLE`, and the current role is shown first. An active `FLEET_OPERATIONS` membership is left unchanged. The user and fleet pair is never duplicated.

All writes run in one database transaction. A failure rolls the transaction back.

## Verification

A successful execute report lists email, user id, fleet id, fleet name, fleet slug, role `FLEET_OPERATIONS`, user status `ACTIVE`, membership status `ACTIVE`, and whether the user and membership were created, changed, or unchanged. It does not include the password or the password hash.

Sign in at `https://backofficefleet.com/api/auth/signin`. The session membership should show the same fleet and `FLEET_OPERATIONS`.

## Walkthrough after sign-in

The tool does not open the application. After a real sign-in, walk:

Command Center, Dispatch, Drivers, the driver file, Current assignment, Operations File Cabinet, Settlements, then Command Center Proof review.

Command Center, Dispatch, the driver roster, the driver file, Current assignment, settlement holds, and Proof review are live fleet data. The file cabinet shows sample files and says they are not live carrier evidence. Settlements are proof-related holds, not live payroll. Maintenance, Safety, and Carrier Registry stay demo or static.
