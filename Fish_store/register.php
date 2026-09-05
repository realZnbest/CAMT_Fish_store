<?php

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'POST method required',
    ]);
    exit;
}

$username = trim((string) ($_POST['username'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

if ($username === '' || $phone === '' || $password === '') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Username, phone, and password are required',
    ]);
    exit;
}

$check_statement = $conn->prepare(
    'SELECT user_id FROM users WHERE username = ? LIMIT 1'
);

if ($check_statement === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to process the registration request',
    ]);
    exit;
}

$check_statement->bind_param('s', $username);
$check_statement->execute();
$check_statement->store_result();

if ($check_statement->num_rows > 0) {
    $check_statement->close();
    echo json_encode([
        'status' => 'error',
        'message' => 'Username already exists',
    ]);
    exit;
}

$check_statement->close();

$hashed_password = password_hash($password, PASSWORD_DEFAULT);
$insert_statement = $conn->prepare(
    'INSERT INTO users (username, phone, password) VALUES (?, ?, ?)'
);

if ($insert_statement === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to process the registration request',
    ]);
    exit;
}

$insert_statement->bind_param('sss', $username, $phone, $hashed_password);

if (!$insert_statement->execute()) {
    $insert_statement->close();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to process the registration request',
    ]);
    exit;
}

$insert_statement->close();

echo json_encode(['status' => 'success']);
