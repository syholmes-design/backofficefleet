<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const SCENARIO_RECIPIENT = 'demo@backofficefleet.com';
const SCENARIO_FROM = 'no-reply@backofficefleet.com';
const MAX_BODY_BYTES = 24000;
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

function post_data(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        return $_POST;
    }
    if (strlen($raw) > MAX_BODY_BYTES) {
        respond(413, [
            'ok' => false,
            'message' => 'The assessment summary is too long. Please shorten the assessment description and try again.'
        ]);
    }

    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (strpos($contentType, 'application/json') !== false) {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            respond(400, [
                'ok' => false,
                'message' => 'BOF could not read the assessment details. Please review the assessment form and try again.'
            ]);
        }
        return $decoded;
    }

    return $_POST;
}

function checked_categories(array $data): array
{
    $categories = $data['scenarioCategory'] ?? [];
    if (!is_array($categories)) {
        $categories = [$categories];
    }
    $categories = array_map(static function ($value): string {
        return clean_text($value, 80);
    }, $categories);
    return array_values(array_filter($categories, static function ($value): bool {
        return $value !== '';
    }));
}

function scenario_summary(array $data, array $categories): string
{
    $lines = [
        'BOF BOF Assessment Request',
        '',
        'Prospect name: ' . clean_text($data['name'] ?? '', 160),
        'Company: ' . clean_text($data['company'] ?? '', 180),
        'Contact email: ' . clean_email($data['email'] ?? ''),
        'Phone: ' . clean_text($data['phone'] ?? '', 80),
        'Organization type: ' . clean_text($data['organizationType'] ?? '', 120),
        'Size: ' . clean_text($data['trucks'] ?? 'Not provided', 40) . ' trucks / ' . clean_text($data['drivers'] ?? 'Not provided', 40) . ' drivers / ' . clean_text($data['participatingCarriers'] ?? 'Not applicable', 40) . ' participating carriers or fleets',
        'Assessment focus: ' . (count($categories) ? implode(', ', $categories) : 'Not selected'),
        'Assessment description: ' . clean_text($data['scenarioDescription'] ?? '', 2200),
        'Current process: ' . clean_text($data['currentProcess'] ?? '', 2200),
        'Urgency: ' . clean_text($data['urgency'] ?? '', 120),
        'Preferred demo path: ' . clean_text($data['preferredDemoPath'] ?? '', 120),
        'Recommended BOF demo path: ' . clean_text($data['recommendedDemoPath'] ?? '', 120),
        '',
        'Requested next step: BOF should use this assessment request to review how the workflow would be handled.',
        '',
        'Submission source: backofficefleet.com/scenario-walkthrough'
    ];
    return implode("\n", $lines);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'ok' => false,
        'message' => 'Please submit the request from the BOF Assessment page.'
    ]);
}

$data = post_data();

if (clean_text($data['website'] ?? '', 120) !== '') {
    respond(200, [
        'ok' => true,
        'message' => 'Assessment request received. Thank you.'
    ]);
}

$startedAt = (float) clean_text($data['startedAt'] ?? '0', 40);
$elapsedSeconds = $startedAt > 0 ? (time() - ($startedAt / 1000)) : 0;
if ($elapsedSeconds > 0 && $elapsedSeconds < MIN_FORM_AGE_SECONDS) {
    respond(429, [
        'ok' => false,
        'message' => 'Please take a moment to review the assessment summary before sending.'
    ]);
}
if ($elapsedSeconds > MAX_FORM_AGE_SECONDS) {
    respond(400, [
        'ok' => false,
        'message' => 'This form session expired. Please refresh the page and try again.'
    ]);
}

$required = [
    'name' => 'name',
    'company' => 'company',
    'email' => 'email',
    'organizationType' => 'organization type',
    'scenarioDescription' => 'assessment description'
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
        'message' => 'Please complete ' . implode(', ', $missing) . ' before sending the assessment request.'
    ]);
}

$email = clean_email($data['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, [
        'ok' => false,
        'message' => 'Please enter a valid email address before sending the assessment request.'
    ]);
}

$categories = checked_categories($data);
$company = clean_text($data['company'] ?? 'Company', 120);
$subject = 'BOF BOF Assessment Request - ' . $company;
$body = scenario_summary($data, $categories);

$headers = [
    'From: BOF BOF Assessment <' . SCENARIO_FROM . '>',
    'Reply-To: ' . clean_text($data['name'] ?? 'Assessment Prospect', 120) . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: BOF BOF Assessment'
];

$sent = @mail(SCENARIO_RECIPIENT, $subject, wordwrap($body, 78), implode("\r\n", $headers));

if (!$sent) {
    respond(500, [
        'ok' => false,
        'message' => 'BOF could not send the assessment request right now. Your form data is still here; please try again or contact demo@backofficefleet.com.'
    ]);
}

respond(200, [
    'ok' => true,
    'message' => 'Assessment request sent to BOF. We will review it before any BOF Assessment Review or Fleet Operations Review.'
]);
