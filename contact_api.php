<?php
header('Content-Type: application/json');

// Read JSON body
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON',
        'raw' => $raw
    ]);
    exit;
}

// Azure Logic App trigger URL
$logicAppUrl = 'https://prod-29.israelcentral.logic.azure.com:443/workflows/c5bc279f849248b48b291a99f4d66750/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=XkXlcURyhUsAktysGZPiHyjmOUHxJT7mbwPx5yIh6nA';

// Send to Azure
$ch = curl_init($logicAppUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_TIMEOUT => 10,
]);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'curl_failed',
        'details' => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Respond back to frontend
echo json_encode([
    'status' => 'forwarded',
    'azure_http_code' => $httpCode
]);

