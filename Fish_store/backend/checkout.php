<?php

session_start();
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../db.php';

$payload = json_decode(file_get_contents('php://input'), true);
$user_id = filter_var($payload['user_id'] ?? null, FILTER_VALIDATE_INT);
$items = $payload['items'] ?? null;

if ($user_id === false || $user_id === null || $user_id <= 0 || !is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'A signed-in user and at least one cart item are required.']);
    exit;
}

$productStatement = $conn->prepare('SELECT id, name, price FROM products WHERE id = ?');
$orderStatement = $conn->prepare('INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)');

if ($productStatement === false || $orderStatement === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Unable to prepare the order.']);
    exit;
}

$conn->begin_transaction();
$orderItems = [];
$total = 0;
$firstOrderId = null;

try {
    foreach ($items as $item) {
        $product_id = filter_var($item['id'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
        if ($product_id === false || $product_id <= 0 || $quantity === false || $quantity <= 0 || $quantity > 999) {
            throw new RuntimeException('Invalid cart item.');
        }

        $productStatement->bind_param('i', $product_id);
        $productStatement->execute();
        $product = $productStatement->get_result()->fetch_assoc();
        if (!$product) throw new RuntimeException('A cart item is no longer available.');

        $lineTotal = (float) $product['price'] * $quantity;
        $orderStatement->bind_param('iiid', $user_id, $product_id, $quantity, $lineTotal);
        if (!$orderStatement->execute()) throw new RuntimeException('Unable to save the order.');
        if ($firstOrderId === null) $firstOrderId = $orderStatement->insert_id;

        $total += $lineTotal;
        $orderItems[] = [
            'id' => (int) $product['id'],
            'name' => $product['name'],
            'price' => (float) $product['price'],
            'quantity' => $quantity,
            'total' => $lineTotal
        ];
    }
    $conn->commit();
} catch (Throwable $error) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $error->getMessage()]);
    exit;
}

$productStatement->close();
$orderStatement->close();
echo json_encode([
    'status' => 'success',
    'order_id' => $firstOrderId,
    'items' => $orderItems,
    'total_price' => $total,
    'created_at' => date('c')
]);
