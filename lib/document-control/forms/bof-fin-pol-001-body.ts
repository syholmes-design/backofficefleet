/**
 * Body recovered from source-assets/policies/Payroll Compensation and Deductions Policy.docx
 * DAT identity HR-PAY-001. BOF controlled identity is BOF-FIN-POL-001.
 * BOF document-control approval is not invented from the DAT signature block.
 */
export const BOF_FIN_POL_001_BODY_HTML = `
<div class="callout">Recovered from the Delta Advanced Trucking, Inc. DOCX titled Payroll, Compensation, and Deductions Policy (HR-PAY-001). The teal vault HTML was an impostor and is not this policy. BOF code BOF-FIN-POL-001 overlays the existing href. DAT signatures in the source are not treated as BOF controlled-document approval.</div>
<p><span class="tag tag-pol">Company policy</span> <span class="tag tag-reg">Cited in source: FLSA, 49 CFR Part 376, IRS reporting</span> <span class="tag tag-review">Legal / compliance review required before treating as employment or tax authority</span></p>

<h2>Recovered identity</h2>
<table class="grid">
  <tr><th>Source title</th><td>Payroll, Compensation, and Deductions Policy (including settlement-focused extract)</td></tr>
  <tr><th>Source policy number</th><td>HR-PAY-001</td></tr>
  <tr><th>BOF controlled code</th><td>BOF-FIN-POL-001</td></tr>
  <tr><th>Source company</th><td>Delta Advanced Trucking, Inc.</td></tr>
  <tr><th>Source department</th><td>Human Resources / Payroll Administration</td></tr>
  <tr><th>Source effective date</th><td>January 1, 2026</td></tr>
  <tr><th>Source revision date</th><td>May 13, 2026</td></tr>
  <tr><th>Source classification</th><td>INTERNAL USE ONLY</td></tr>
</table>

<h2>Section 1 — Purpose and scope</h2>
<p>This policy establishes the standards, procedures, and requirements governing payroll, compensation, and deductions for Delta Advanced Trucking, Inc. It is designed to ensure accurate, timely, transparent, and legally compliant payment to covered personnel including company drivers, owner-operators, lease-purchase operators, yard personnel, and dispatchers.</p>
<p>Scope in the source: CDL-A and CDL-B company drivers (OTR, regional, local); owner-operators and independent contractors operating under the company’s motor carrier authority; lease-purchase drivers under a written lease; non-driving employees including dispatchers, yard hands, dock workers, and administrative staff; team drivers and driver trainers.</p>
<p><span class="tag tag-review">MC number is blank in the source.</span></p>
<p>The source states it was developed with reference to FMCSA regulations (49 CFR Parts 370–379), the Fair Labor Standards Act, Truth-in-Leasing (49 CFR Part 376), IRS independent-contractor reporting (Form 1099-NEC), and applicable state wage-payment law. Those citations are recovered from the source. They are not independently verified here.</p>

<h2>Section 2 — Definitions (recovered)</h2>
<table class="grid">
  <tr><th>Term</th><th>Source meaning</th></tr>
  <tr><td>Settlement</td><td>Periodic accounting statement for an owner-operator or lease-purchase driver itemizing gross revenue, deductions, and net pay.</td></tr>
  <tr><td>Linehaul revenue</td><td>Base freight revenue for transporting a load, as specified in the compensation agreement.</td></tr>
  <tr><td>Accessorial pay</td><td>Pay beyond linehaul (detention, layover, tarping, lumper reimbursement, stop-off, team premium, TWIC/HAZMAT premiums).</td></tr>
  <tr><td>Fuel surcharge (FSC)</td><td>Variable charge indexed to DOE weekly retail diesel; driver/operator share defined in the individual compensation agreement.</td></tr>
  <tr><td>Chargeback</td><td>Deduction for costs incurred on the driver’s or operator’s behalf (claims, permits, tolls, attributable fines).</td></tr>
  <tr><td>Escrow</td><td>Funds withheld as security pursuant to 49 CFR § 376.12(k), subject to written escrow terms.</td></tr>
  <tr><td>Per-diem</td><td>Daily meals and incidentals allowance while away from tax home overnight (source cites IRS Publication 463).</td></tr>
  <tr><td>Comcheck / EFS / T-Chek</td><td>Company-issued payment instrument for authorized road expenses, deducted from settlement.</td></tr>
</table>

<h2>Section 3 — Pay periods and settlement schedules</h2>
<p>Company drivers: bi-weekly, Monday 12:00 AM through Sunday 11:59 PM. Source states payroll is processed Mondays after close, with direct deposit no later than Friday of that week; paper checks at the terminal Friday by 5:00 PM.</p>
<p>Owner-operators and lease-purchase: weekly Monday–Sunday. Source states statements processed Monday; remittance via ACH or check no later than Thursday; statements available by Wednesday via portal or mail.</p>
<p>Minimum itemization in the source: gross revenue per load; load/trip ID; origin/destination; loaded and deadhead miles; accessorials; FSC and share; deductions by category; escrow activity; net pay.</p>
<p>The Company shall not withhold or delay settlement without lawful cause. Documentation failures (missing BOL, unsigned delivery receipt, incomplete fuel-card reconciliation) may hold the affected load. Source requires written notice within 24 hours of a settlement hold.</p>

<h2>Section 4 — Compensation structures (source tables)</h2>
<p>Per-mile, percentage-of-load, hourly, team, and owner-operator methods are defined in the source. Rates below are recovered from HR-PAY-001 as published ranges subject to individual agreement. They are not BOF settlement math and do not replace structured BOF settlement records.</p>
<table class="grid">
  <tr><th>Driver classification</th><th>Loaded CPM</th><th>Deadhead CPM</th></tr>
  <tr><td>Entry-level OTR</td><td>$0.48–$0.52</td><td>$0.25</td></tr>
  <tr><td>Experienced OTR (2+ years)</td><td>$0.54–$0.60</td><td>$0.28</td></tr>
  <tr><td>Driver trainer</td><td>Base CPM + $0.05 training premium per trainee mile</td><td>Varies</td></tr>
  <tr><td>HazMat endorsed</td><td>+$0.02–$0.03 on qualifying loads</td><td>Standard</td></tr>
  <tr><td>Team drivers (each)</td><td>60% of individual CPM on team miles</td><td>Standard</td></tr>
</table>
<p>Percentage-of-load: source range 25%–30% of gross linehaul, excluding FSC unless negotiated. Owner-operator source ranges: standard lanes 70%–78% of gross linehaul; dedicated 75%–82%; FSC 100% passthrough unless otherwise agreed in the COA.</p>
<p>Hourly non-driving staff: source cites overtime at 1.5× after 40 hours per workweek consistent with FLSA.</p>

<h2>Section 5 — Accessorials (source table)</h2>
<table class="grid">
  <tr><th>Type</th><th>Source rate</th><th>Conditions in source</th></tr>
  <tr><td>Stop-off</td><td>$25.00 per additional stop</td><td>Beyond origin and first delivery</td></tr>
  <tr><td>Detention</td><td>$15.00–$25.00/hour</td><td>After 2 free hours; timestamp on BOL or sign-in log</td></tr>
  <tr><td>Layover</td><td>$100.00–$150.00 per 24 hours</td><td>Held more than 12 hours between loads</td></tr>
  <tr><td>Tarping</td><td>$50.00–$75.00 per load</td><td>Flatbed only</td></tr>
  <tr><td>Lumper</td><td>100% pass-through</td><td>Receipt required</td></tr>
  <tr><td>TWIC / HazMat premium</td><td>$35.00–$50.00 per qualifying load</td><td>TWIC access or HazMat placard</td></tr>
  <tr><td>Scale tickets</td><td>100% reimbursement</td><td>Receipt required</td></tr>
  <tr><td>Breakdown assistance</td><td>$100.00 flat</td><td>Verified delay exceeding 4 hours</td></tr>
</table>
<p>Company drivers receive no separate FSC (factored into CPM). Owner-operators receive contractually agreed FSC as an itemized line. Detention disputes: supporting documentation within five business days of the settlement date (source).</p>

<h2>Section 6 — Deductions, chargebacks, and escrow</h2>
<p>Mandatory company-driver deductions in the source: federal and state income tax, Social Security 6.2%, Medicare 1.45%, court-ordered garnishments, uniforms/PPE if applicable not to exceed $10.00/week. Voluntary deductions require signed authorization.</p>
<p>Owner-operator chargebacks may include fuel advances, permits, unpaid tolls, cargo claims after investigation and written notice, attributable fines, occupational accident / physical damage / bobtail insurance if arranged, ELD lease, Pre-Pass fees, and escrow contributions.</p>
<p>Source compliance notice: no owner-operator chargeback without itemized description, supporting documentation on request, and compliance with 49 CFR § 376.12.</p>
<p>Escrow (source): maximum $2,500 or as negotiated; identified on each statement; accounting within 30 days of written request; return within 45 days after termination less lawful chargebacks; not for general operating funds.</p>
<p>Unauthorized use of company payment instruments: recovery plus $25.00 administrative fee per incident (source) and possible COA termination.</p>

<h2>Section 7 — Payment methods</h2>
<p>Direct deposit encouraged for company drivers (authorization + voided check/bank letter; banking changes 10 business days before desired pay date). Owner-operator ACH per COA; banking changes take effect no sooner than the second settlement week. Paper-check stop-payment/reissuance fee $35.00 unless fraud is confirmed. Pay-card ATM/POS network fees are the driver’s responsibility; source states the company does not charge loading fees.</p>

<h2>Section 8 — Review and disputes</h2>
<p>Right to review the statement and request supporting documentation within 30 days of delivery. Informal dispute to Settlement/Payroll with name/ID, settlement date, load numbers, dollar amount, and description. Formal grievance to Director of Payroll and Human Resources if unresolved in 10 business days; written response within 15 business days.</p>
<p>Cargo-claim chargebacks: investigation, written notice and opportunity to respond, reasonably established liability; applied over no more than four consecutive settlement periods unless agreed in writing.</p>
<p>Source contact placeholders include payroll@[company].com and a later line payroll@deltaadvanced.com. Those strings are recovered as written. They are not verified live BOF mailboxes.</p>

<h2>Section 9 — Recordkeeping</h2>
<p>Source retention: payroll records minimum three years (FLSA) and five years for owner-operator lease records (49 CFR § 376.12). W-2 / 1099-NEC timing: no later than January 31 of the following year; 1099-NEC if $600 or more.</p>

<h2>Section 10 — Enforcement (source)</h2>
<p>Company-driver violations may result in written warning, unpaid suspension, termination, or referral where applicable. Owner-operator violations may result in dispatch suspension, recovery of advances/chargebacks, COA termination per its terms, or legal action for company losses.</p>

<h2>Part II — Settlement extract (driver reference)</h2>
<p>The source extract does not replace Part I. Net pay = gross minus total deductions. Negative net may carry forward with written notice. Owner-operator settlements are not W-2 paychecks; self-employment tax responsibility is stated in the source.</p>
<table class="grid">
  <tr><th>Line</th><th>Item</th></tr>
  <tr><td>1</td><td>Load revenue / rate confirmation amount</td></tr>
  <tr><td>2</td><td>Fuel surcharge (passthrough share for owner-operators)</td></tr>
  <tr><td>3</td><td>Accessorial pay</td></tr>
  <tr><td>4</td><td>Gross before deductions</td></tr>
  <tr><td>5</td><td>Itemized deductions</td></tr>
  <tr><td>6</td><td>Net pay</td></tr>
</table>
<p>Structured BOF settlement statements remain the system of record for computed totals. This policy does not recalculate BOF settlement math.</p>
`;
