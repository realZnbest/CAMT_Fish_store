<?php

session_start();
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/db.php';

$username = trim((string) ($_POST['username'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

$statement = $conn->prepare(
    'SELECT user_id, password FROM users WHERE username = ? LIMIT 1'
);

if ($statement === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to process the login request',
    ]);
    exit;
}

$statement->bind_param('s', $username);
$statement->execute();
$statement->store_result();

$user_id = null;
$stored_password = null;
$statement->bind_result($user_id, $stored_password);

$password_matches = false;
if ($statement->num_rows === 1 && $statement->fetch()) {
    $password_matches = password_verify($password, (string) $stored_password);

    // Upgrade legacy plaintext passwords after a successful login.
    if (!$password_matches && hash_equals((string) $stored_password, $password)) {
        $password_matches = true;
        $upgraded_password = password_hash($password, PASSWORD_DEFAULT);
        $upgrade_statement = $conn->prepare(
            'UPDATE users SET password = ? WHERE user_id = ?'
        );
        if ($upgrade_statement !== false) {
            $upgrade_statement->bind_param('si', $upgraded_password, $user_id);
            $upgrade_statement->execute();
            $upgrade_statement->close();
        }
    }
}

if (
    !$password_matches
) {
    $statement->close();
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid credentials',
    ]);
    exit;
}

$statement->close();
session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user_id;

echo json_encode([
    'status' => 'success',
    'user_id' => (int) $user_id,
]);