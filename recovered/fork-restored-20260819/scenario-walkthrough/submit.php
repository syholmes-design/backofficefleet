<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const SCENARIO_RECIPIENT = 'demo@backofficefleet.com';
const SCENARIO_FROM = 'no-reply@backofficefleet.com';
const MAX_BODY_BYTES = 64000;
const MIN_FORM_AGE_SECONDS = 3;
const MAX_FORM_AGE_SECONDS = 14400;

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_text($value, int $maxLength = 1200): string
{
    if (is_array($value)) {
        $value = implode(', ', array_map('strval', $value));
    }
    $value = trim((string) $value);
    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
    if (strlen($value) > $maxLength) {
        $value = substr($value, 0, $maxLength);
    }
    return $value;
}

function clean_email($value): string
{
    return str_replace(["\r", "\n"], '', clean_text($value, 254));
}

function clean_header($value, int $maxLength = 180): string
{
    if (is_array($value)) {
        $value = implode(' ', array_map('strval', $value));
    }
    $value = strip_tags((string) $value);
    $value = str_replace(["\r", "\n"], ' ', $value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
    $value = preg_replace('/\s+/', ' ', $value);
    $value = trim($value);
    if (strlen($value) > $maxLength) {
        $value = substr($value, 0, $maxLength);
    }
    return $value;
}

function clean_list(array $data, string $field, int $maxLength = 160): array
{
    $values = $data[$field] ?? [];
    if (!is_array($values)) {
        $values = [$values];
    }
    $values = array_map(static function ($value) use ($maxLength): string {
        return clean_text($value, $maxLength);
    }, $values);
    return array_values(array_filter($values, static function ($value): bool {
        return $value !== '';
    }));
}

function post_data(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        return $_POST;
    }
    if (strlen($raw) > MAX_BODY_BYTES) {
        respond(413, [
            'ok' => false,
            'message' => 'The BOF Fleet Assessment is too long. Please shorten long notes and try again.'
        ]);
    }

    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (strpos($contentType, 'application/json') !== false) {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            respond(400, [
                'ok' => false,
                'message' => 'BOF could not read the assessment details. Please review the form and try again.'
            ]);
        }
        return $decoded;
    }

    return $_POST;
}

function field_labels(): array
{
    return [
        'company' => 'Company name',
        'name' => 'Contact name',
        'email' => 'Email',
        'phone' => 'Phone',
        'trucks' => 'Number of trucks',
        'drivers' => 'Number of drivers',
        'ownerOperators' => 'Owner-operators / contractors',
        'freightType' => 'Freight type',
        'operatingRegions' => 'Operating states or regions',
        'currentSystems' => 'Current systems used',
        'cdlElectronic' => 'CDL records stored electronically',
        'medicalCardsTracked' => 'Medical cards tracked electronically',
        'dqfCentralized' => 'DQF files centralized',
        'mvrRenewalsTracked' => 'MVR renewals tracked',
        'workerRecordsCentralized' => 'W-9/I-9 or contractor records centralized',
        'trainingRecordsTracked' => 'Training records tracked',
        'documentExpirationsFlagged' => 'Document expirations automatically flagged',
        'driverReadinessDelays' => 'Driver readiness delays',
        'documentStorage' => 'Document storage',
        'documentsTiedToRecords' => 'Documents tied to drivers, loads, and customers',
        'documentVersionsControlled' => 'Document versions controlled',
        'requiredRecordsSearchable' => 'Required records searchable',
        'expiredMissingDocsFlagged' => 'Expired/missing documents flagged',
        'loadsReceived' => 'How loads are received',
        'loadIntakeStructured' => 'Structured load intake form or portal',
        'rateConfirmationsStored' => 'Rate confirmations stored with load',
        'loadInstructionsCentralized' => 'Load instructions centralized',
        'pickupDeliveryPhotosTracked' => 'Pickup/delivery photos tracked',
        'dispatchExceptionsDocumented' => 'Dispatch exceptions documented',
        'customerUpdates' => 'Customer updates',
        'podsCaptured' => 'How PODs are captured',
        'podsTiedToLoad' => 'PODs tied to load record',
        'cargoPhotosCaptured' => 'Cargo photos captured',
        'sealPhotosCaptured' => 'Seal photos captured',
        'lumperReceiptsCaptured' => 'Lumper receipts captured',
        'claimEvidencePacketsCreated' => 'Claim evidence packets created',
        'missingPodsBlockBillingSettlement' => 'Missing PODs blocking billing or settlement',
        'payTypes' => 'Pay types used',
        'settlementsTiedToLoads' => 'Settlements tied to load records',
        'settlementHoldsTracked' => 'Settlement holds tracked',
        'missingDocsDelayPay' => 'Missing documents delaying driver pay',
        'employeeContractorWorkflowsDifferent' => 'Employee and contractor workflows handled differently',
        'usesFactoring' => 'Uses factoring',
        'factoringPacketOwner' => 'Who prepares factoring packets',
        'factoringPacketsChecked' => 'Factoring packet checks before submission',
        'incompletePacketsTracked' => 'Incomplete packets tracked',
        'receivablesTracked' => 'Receivables tracked',
        'cashFlowVisibility' => 'Cash-flow visibility',
        'fundingDelays' => 'Funding delays',
        'writtenPayrollPolicies' => 'Written payroll policies',
        'writtenAccountingProcedures' => 'Written accounting/bookkeeping procedures',
        'writtenOperatingProcedures' => 'Written operating procedures',
        'writtenHrPolicies' => 'Written HR policies',
        'policiesLastUpdated' => 'Policies last updated',
        'workflowsAutomated' => 'Workflows automated',
        'remindersAutomated' => 'Automated reminders and exceptions',
        'policyComplianceReviewer' => 'Policy compliance reviewer',
        'hrTierChoice' => 'HR Tier Review choice',
        'hrRecruiting' => 'How drivers/workers are recruited',
        'hrOnboarding' => 'How new workers are onboarded',
        'hrRecordsCentralized' => 'Employee/contractor records centralized',
        'benefitsTracking' => 'Benefits tracked internally or externally',
        'trainingDevelopmentTracking' => 'Training and development tracking',
        'readinessRenewalMonitoring' => 'Readiness and renewal monitoring',
        'hrOwnerPressure' => 'HR owner-level pressure',
        'financeTierChoice' => 'Finance Tier Review choice',
        'bookkeepingOwner' => 'Bookkeeping owner',
        'accountingOwner' => 'Accounting owner',
        'apArTrackedElectronically' => 'AP and AR tracked electronically',
        'payrollSettlementsDocumented' => 'Payroll and settlements documented',
        'financeUsesFactoring' => 'Finance factoring use',
        'exciseTaxItemsTracked' => 'Federal/state excise tax review items tracked',
        'cashFlowReporting' => 'Cash-flow reporting',
        'financeOwnerPressure' => 'Finance owner-level pressure',
        'biggestProblem' => 'Biggest current back-office problem',
        'monthlyAdminHours' => 'Estimated monthly admin hours',
        'desiredBofHelp' => 'Areas where BOF help is most desired',
        'permissionToContact' => 'Permission to contact'
    ];
}

function list_fields(): array
{
    return [
        'documentStorage' => true,
        'payTypes' => true,
        'desiredBofHelp' => true,
        'permissionToContact' => true
    ];
}

function summary_line(string $label, $value, bool $isList = false): string
{
    if ($isList) {
        $values = is_array($value) ? $value : [];
        return $label . ': ' . (count($values) ? implode(', ', $values) : 'Not selected');
    }
    $text = (string) $value;
    return $label . ': ' . ($text !== '' ? $text : 'Not provided');
}

function assessment_summary(array $data): string
{
    $labels = field_labels();
    $lists = list_fields();
    $lines = [
        'BOF Fleet Assessment',
        '',
        'This assessment helps BOF review driver records, document workflows, load intake, POD process, settlements, factoring readiness, operating policies, automation, and selected HR/Finance sections.',
        '',
        'Fleet Profile'
    ];

    foreach ($labels as $field => $label) {
        $isList = isset($lists[$field]);
        $value = $isList ? clean_list($data, $field) : clean_text($data[$field] ?? '', 2200);
        if ($field === 'email') {
            $value = clean_email($data[$field] ?? '');
        }
        $lines[] = summary_line($label, $value, $isList);
    }

    $lines[] = '';
    $lines[] = 'Important note: This assessment is advisory intake only. It does not guarantee final pricing, final implementation scope, funding outcomes, payroll decisions, HR decisions, accounting treatment, tax treatment, legal advice, or implementation timing.';
    $lines[] = 'Submission source: backofficefleet.com/scenario-walkthrough';

    return implode("\n", $lines);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'ok' => false,
        'message' => 'Please submit the request from the BOF Fleet Assessment page.'
    ]);
}

$data = post_data();

if (clean_text($data['website'] ?? '', 120) !== '') {
    respond(200, [
        'ok' => true,
        'message' => 'Your BOF Fleet Assessment has been submitted.'
    ]);
}

$startedAt = (float) clean_text($data['startedAt'] ?? '0', 40);
$elapsedSeconds = $startedAt > 0 ? (time() - ($startedAt / 1000)) : 0;
if ($elapsedSeconds > 0 && $elapsedSeconds < MIN_FORM_AGE_SECONDS) {
    respond(429, [
        'ok' => false,
        'message' => 'Please take a moment to review the assessment summary before submitting.'
    ]);
}
if ($elapsedSeconds > MAX_FORM_AGE_SECONDS) {
    respond(400, [
        'ok' => false,
        'message' => 'This form session expired. Please refresh the page and try again.'
    ]);
}

$required = [
    'company' => 'company name',
    'name' => 'contact name',
    'email' => 'email',
    'biggestProblem' => 'biggest current back-office problem'
];
$missing = [];
foreach ($required as $field => $label) {
    if (clean_text($data[$field] ?? '', 2200) === '') {
        $missing[] = $label;
    }
}
if (count($missing)) {
    respond(422, [
        'ok' => false,
        'message' => 'Please complete ' . implode(', ', $missing) . ' before submitting the BOF Fleet Assessment.'
    ]);
}

$email = clean_email($data['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, [
        'ok' => false,
        'message' => 'Please enter a valid email address before submitting the BOF Fleet Assessment.'
    ]);
}

$company = clean_header($data['company'] ?? 'Company', 120);
$replyName = clean_header($data['name'] ?? 'Assessment Prospect', 120);
$subject = 'BOF Fleet Assessment - ' . $company;
$body = assessment_summary($data);

$headers = [
    'From: BOF Fleet Assessment <' . SCENARIO_FROM . '>',
    'Reply-To: ' . $replyName . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: BOF Fleet Assessment'
];

$sent = @mail(SCENARIO_RECIPIENT, $subject, wordwrap($body, 78), implode("\r\n", $headers));

if (!$sent) {
    respond(500, [
        'ok' => false,
        'message' => 'BOF could not submit the assessment right now. Your answers are still here; please try again or contact demo@backofficefleet.com.'
    ]);
}

respond(200, [
    'ok' => true,
    'message' => 'Your BOF Fleet Assessment has been submitted. BOF will review your driver records, document workflows, load intake, POD process, settlement structure, factoring readiness, operating policies, automation, and selected HR/Finance sections. Your assessment will help identify where BOF may reduce administrative pressure, improve document readiness, strengthen settlement workflows, and increase operational visibility.'
]);
