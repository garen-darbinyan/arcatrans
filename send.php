<?php
/**
 * Form handler for the Arcatrans website (quote and tracking forms).
 * Works on GoDaddy cPanel / Linux hosting with PHP mail().
 *
 * 1. Set RECIPIENT to the inbox that should receive submissions.
 * 2. Set FROM_ADDRESS to an address on your own domain (required by GoDaddy's mail relay).
 */
const RECIPIENT    = 'dispatch@arcatrans.com';
const FROM_ADDRESS = 'website@arcatrans.com';

header('Content-Type: application/json; charset=utf-8');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

// Honeypot: bots fill hidden fields. Pretend success.
if (!empty($_POST['website'])) {
    respond(200, ['ok' => true]);
}

// Basic per-session rate limit: one submission every 20 seconds.
session_start();
if (isset($_SESSION['last_submit']) && time() - $_SESSION['last_submit'] < 20) {
    respond(429, ['ok' => false, 'error' => 'Please wait a moment and try again.']);
}

function field(string $name, int $max = 500): string {
    $v = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}

$forms = [
    'quote' => [
        'subject'  => 'New quote request',
        'required' => ['origin', 'destination', 'name', 'email'],
        'fields'   => [
            'origin' => 'Pickup', 'destination' => 'Delivery', 'pickup_date' => 'Pickup date',
            'equipment' => 'Equipment', 'weight' => 'Weight (lbs)', 'notes' => 'Commodity / notes',
            'name' => 'Name', 'company' => 'Company', 'phone' => 'Phone', 'email' => 'Email',
        ],
    ],
    'tracking' => [
        'subject'  => 'Shipment status request',
        'required' => ['load_number', 'email'],
        'fields'   => ['load_number' => 'Load / PRO / BOL', 'email' => 'Email'],
    ],
];

$type = field('form_type', 20);
if (!isset($forms[$type])) {
    respond(400, ['ok' => false, 'error' => 'Unknown form']);
}
$form = $forms[$type];

foreach ($form['required'] as $req) {
    if (field($req) === '') {
        respond(422, ['ok' => false, 'error' => 'Missing required field: ' . $req]);
    }
}

$email = field('email', 254);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'Invalid email address']);
}

$lines = [];
foreach ($form['fields'] as $key => $label) {
    $max = $key === 'notes' ? 3000 : 300;
    $lines[] = str_pad($label . ':', 26) . field($key, $max);
}
$lines[] = '';
$lines[] = 'Submitted: ' . date('Y-m-d H:i:s T');
$lines[] = 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

$subject = $form['subject'];
if ($type === 'quote') {
    $subject .= ': ' . field('origin', 60) . ' → ' . field('destination', 60);
}
$subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$headers = [
    'From: Arcatrans Website <' . FROM_ADDRESS . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = mail(RECIPIENT, $subject, implode("\n", $lines), implode("\r\n", $headers), '-f' . FROM_ADDRESS);
if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'Mail could not be sent']);
}

$_SESSION['last_submit'] = time();
respond(200, ['ok' => true]);
