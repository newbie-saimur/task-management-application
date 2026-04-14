<?php
/**
 * Reorder Tasks API (for drag & drop)
 * 
 * Accepts POST request with: task_ids (JSON array of IDs in new order)
 * Updates the position field for each task
 */

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get raw POST data (JSON array)
$input = file_get_contents('php://input');
$task_ids = json_decode($input, true);

if (!is_array($task_ids) || empty($task_ids)) {
    echo json_encode(['success' => false, 'message' => 'Invalid task order data']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Update position for each task
$stmt = $conn->prepare('UPDATE tasks SET position = ? WHERE id = ? AND user_id = ?');

$success = true;
$position = 1;

foreach ($task_ids as $task_id) {
    $task_id = intval($task_id);
    if ($task_id > 0) {
        $stmt->bind_param('iii', $position, $task_id, $user_id);
        if (!$stmt->execute()) {
            $success = false;
            break;
        }
    }
    $position++;
}

$stmt->close();
$conn->close();

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Tasks reordered successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to reorder tasks']);
}
?>
