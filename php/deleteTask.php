<?php
/**
 * Delete Task API
 * 
 * Accepts POST request with: task_id
 * Returns JSON response with success/failure message
 * Requires user to be logged in (session check)
 * Validates that the task belongs to the logged-in user
 */

// Start session to verify logged-in user
session_start();

// Include database connection
require_once 'db.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// --- Check if user is logged in ---
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete tasks']);
    exit;
}

// Get and sanitize input data
$task_id = intval($_POST['task_id'] ?? 0);

// --- Validation: task_id is required ---
if ($task_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
    exit;
}

$user_id = $_SESSION['user_id'];

// --- Verify that this task belongs to the logged-in user ---
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

// --- Delete the task ---
$stmt = $conn->prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
$stmt->bind_param('ii', $task_id, $user_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete task']);
}

$stmt->close();
$conn->close();
?>
