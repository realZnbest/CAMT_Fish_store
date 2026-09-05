<?php

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/db.php';

$result = $conn->query(
    'SELECT id, name, price, description FROM products'
);

if ($result === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unable to fetch products',
    ]);
    exit;
}

$products = [];

while ($row = $result->fetch_assoc()) {
    $products[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'price' => $row['price'],
        'description' => $row['description'],
    ];
}

$result->free();

echo json_encode($products);
