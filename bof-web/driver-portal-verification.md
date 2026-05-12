# Driver Portal Verification Framework

## Expected Document Status for All Drivers

Based on the canonical document registry, each driver should have these documents available:

### Core Documents (All Drivers)
- **CDL**: `/generated/drivers/DRV-XXX/cdl.html`
- **Medical Certification**: `/generated/drivers/DRV-XXX/medical-card.html`
- **MVR**: `/documents/drivers/DRV-XXX/mvr-card.html`
- **Bank Information**: `/generated/drivers/DRV-XXX/bank-info.html`
- **Emergency Contact**: `/generated/drivers/DRV-XXX/emergency-contact.html`
- **Driver Application**: `/documents/drivers/DRV-XXX/driver-application.html`
- **Road Test Certificate**: `/generated/drivers/DRV-XXX/road-test-certificate.html`
- **Employment Verification**: `/generated/drivers/DRV-XXX/employment_verification.html`
- **FMCSA Clearinghouse**: `/generated/drivers/DRV-XXX/mcsa-5876-signed.html`
- **I-9**: `/generated/drivers/DRV-XXX/i9.html`
- **Incident Reports**: `/generated/drivers/DRV-XXX/incident-report.html`
- **Prior Employer Inquiry**: `/generated/drivers/DRV-XXX/prior_employer_inquiry.html`
- **Safety Performance History**: `/generated/drivers/DRV-XXX/safety-acknowledgment.html`
- **Secondary Contact**: `/generated/drivers/DRV-XXX/secondary_contact.html`
- **W-9**: `/documents/drivers/DRV-XXX/w9-drv-XXX.pdf`

### Driver-Specific Details
- **DRV-001 John Carter**: Employee (I-9 required, W-9 not required)
- **DRV-002 Maria Lopez**: Employee (I-9 required, W-9 not required)
- **DRV-003 Alex Kim**: Employee (I-9 required, W-9 not required)
- **DRV-004 Priya Patel**: Employee (I-9 required, W-9 not required)
- **DRV-005 Kenji Tanaka**: Employee (I-9 required, W-9 not required)
- **DRV-006 Marcus Chen**: Owner-Operator (W-9 required, I-9 not required)
- **DRV-007 Sofia Gomez**: Employee (I-9 required, W-9 not required)
- **DRV-008 Liam Smith**: Employee (I-9 required, W-9 not required)
- **DRV-009 Emma Brown**: Employee (I-9 required, W-9 not required)
- **DRV-010 Noah Wilson**: Owner-Operator (W-9 required, I-9 not required)
- **DRV-011 Olivia Lee**: Employee (I-9 required, W-9 not required)
- **DRV-012 Robert Johnson**: Owner-Operator (W-9 required, I-9 not required)

## Verification Checklist

For each driver portal, verify:

### 1. Readiness Badge Consistency
- [ ] Top readiness badge matches document checklist status
- [ ] No "Ready" badge when critical documents are missing

### 2. Document Status Accuracy
- [ ] Documents with files show "Available" or "Valid"
- [ ] No false "Missing" or "Not Available" for existing documents
- [ ] Missing only when truly missing from canonical registry

### 3. Policy Acknowledgment States
- [ ] Show real acknowledgment status (not just file existence)
- [ ] States: Signed, Available, Pending Signature, Pending Review, Missing

### 4. File Access
- [ ] View/Open buttons work and don't produce 404s
- [ ] File paths resolve correctly

### 5. Owner-Operator vs Employee Logic
- [ ] Employees see I-9, not W-9
- [ ] Owner-Operators see W-9, not I-9
- [ ] Additional OO documents appear for DRV-006, DRV-010, DRV-012

## Browser Testing Instructions

1. Navigate to: http://localhost:3002
2. For each driver, visit: /portals/driver/DRV-XXX
3. Complete the verification checklist above
4. Record results in the table below

## Verification Results Table

| Driver ID | Name | Portal Route | Readiness Badge | Available Docs | Missing Docs | Policy Ack Status | Broken Links | Issues |
|-----------|------|--------------|-----------------|----------------|--------------|-------------------|--------------|--------|
| DRV-001 | John Carter | /portals/driver/DRV-001 | | | | | | |
| DRV-002 | Maria Lopez | /portals/driver/DRV-002 | | | | | | |
| DRV-003 | Alex Kim | /portals/driver/DRV-003 | | | | | | |
| DRV-004 | Priya Patel | /portals/driver/DRV-004 | | | | | | |
| DRV-005 | Kenji Tanaka | /portals/driver/DRV-005 | | | | | | |
| DRV-006 | Marcus Chen | /portals/driver/DRV-006 | | | | | | |
| DRV-007 | Sofia Gomez | /portals/driver/DRV-007 | | | | | | |
| DRV-008 | Liam Smith | /portals/driver/DRV-008 | | | | | | |
| DRV-009 | Emma Brown | /portals/driver/DRV-009 | | | | | | |
| DRV-010 | Noah Wilson | /portals/driver/DRV-010 | | | | | | |
| DRV-011 | Olivia Lee | /portals/driver/DRV-011 | | | | | | |
| DRV-012 | Robert Johnson | /portals/driver/DRV-012 | | | | | | |

## Expected Improvements After Fix

### Before Fix Issues:
- Documents showing as "Missing/Not Available" despite existing in canonical registry
- Readiness badge showing "Ready" while documents showed missing
- Policy acknowledgments defaulting to "Missing File"
- Inconsistent status between portal and main Documents pages

### After Fix Expected:
- Documents show actual canonical status (Available/Valid/Missing)
- Readiness badge matches document checklist
- Policy acknowledgments show real acknowledgment states
- Consistent behavior across all driver portals
- No false missing documents
