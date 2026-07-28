# Wave 3 Assessment Scoring Model

## Purpose

The Wave 3 assessment produces directional operational readiness feedback. It is synthetic and based only on answers entered during the current browser session.

## Response Scale

| Answer | Score |
| --- | ---: |
| In place | 3 |
| Partially in place | 2 |
| Unsure | 1 |
| Not in place | 0 |

## Overall Score

Each assessment has 12 questions. The maximum raw score is:

`12 questions x 3 points = 36`

Overall percentage:

`round(total score / maximum score * 100)`

## Readiness Bands

| Percentage | Band |
| --- | --- |
| 78% and above | Strong foundation |
| 56% to 77% | Partially controlled |
| 34% to 55% | Significant gaps |
| Below 34% | Immediate attention recommended |

## Section Scores

Each section is scored independently:

`round(section score / section maximum * 100)`

Section cards are informational and do not claim regulatory status.

## Top Gaps

The engine selects the first three unanswered, `Not in place`, or `Unsure` answers as top operational gaps. If none exist, it selects up to three `Partially in place` answers.

## Strongest Area

Owner correction added a strongest-area callout. The engine sorts section scores and displays the highest scoring section as the strongest preliminary area.

## Recommended Modules

Each audience carries an audience-specific module list:

- Aggregator: Customer Demo - Business Operations, BOF Vault, Documents, Policy Governance
- Private Fleet: Drivers, Dispatch & Operations, Safety & Compliance, Business Operations
- For-Hire Fleet: Dispatch & Operations, Documents, Settlements & Billing, BOF Vault
- Government: Policy Governance, BOF Vault, Business Operations, Safety & Compliance
- Driver: Drivers, BOF Vault, Documents, Safety & Compliance

## Conversion Logic

Results now include a non-persistent detailed-roadmap CTA. Private Fleet, For-Hire Fleet, and Aggregator results may also show Priority Fleet consideration with a link to `/priority-fleet-program/`. No form data is submitted or persisted.

## Disclaimer

The public result includes this disclaimer:

`This assessment is an operational readiness tool and is not legal, regulatory, tax, accounting, insurance, or compliance certification.`

The assessment does not call results certified, compliant, approved, guaranteed, or legally sufficient.
