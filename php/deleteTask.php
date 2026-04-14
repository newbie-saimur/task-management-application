<?php
/**
 * Delete Task API - Soft-deletes task (sets deleted_at timestamp)
 * Accepts: task_id
 * Returns: JSON { success, message }
 */

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete tasks']);
    exit;
}

$task_id = intval($_POST['task_id'] ?? 0);

if ($task_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Verify task ownership and not already deleted
$stmt = $conn->prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?');
$stmt->bind_param('ii', $task_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Task not found or access denied']);
    $stmt->close();
    exit;
}
$stmt->close();

// Soft delete: set deleted_at timestamp
$stmt = $conn->prepare('UPDATE tasks SET deleted_at = NOW() WHERE id = ? AND user_id = ?');
$stmt->bind_param('ii', $task_id, $user_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete task']);
}

$stmt->close();
$conn->close();
?>
