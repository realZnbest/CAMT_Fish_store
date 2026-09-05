<?php

session_start();
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/db.php';

$user_id = filter_input(INPUT_POST, 'user_id', FILTER_VALIDATE_INT);
$product_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);
$quantity = filter_input(INPUT_POST, 'quantity', FILTER_VALIDATE_INT);
$total_price = filter_input(INPUT_POST, 'total_price', FILTER_VALIDATE_FLOAT);

if (
    $user_id === false || $user_id === null || $user_id <= 0
    || $product_id === false || $product_id === null || $product_id <= 0
    || $quantity === false || $quantity === null || $quantity <= 0
    || $total_price === false || $total_price === null || $total_price < 0
) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid order data',
    ]);
    exit;
}

$statement = $conn->prepare(
    'INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)'
);

if ($statement === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to place order',
    ]);
    exit;
}

$statement->bind_param('iiid', $user_id, $product_id, $quantity, $total_price);

if (!$statement->execute()) {
    $statement->close();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to place order',
    ]);
    exit;
}

$statement->close();

echo json_encode(['status' => 'success']);
