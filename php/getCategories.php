<?php
/**
 * Get Categories API
 * 
 * Returns all categories for the logged-in user
 */

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

$stmt = $conn->prepare('SELECT id, name, color FROM categories WHERE user_id = ? ORDER BY name');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

$categories = [];
while ($row = $result->fetch_assoc()) {
    $categories[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode([
    'success'    => true,
    'categories' => $categories,
    'count'      => count($categories)
]);
?>
