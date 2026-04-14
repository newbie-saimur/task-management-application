<?php
/**
 * Update Task API (v2.0)
 * 
 * Accepts POST request with: task_id, title (optional), description (optional), 
 *                              status (optional), priority (optional), category_id (optional), due_date (optional)
 * Returns JSON response with updated task data
 * Requires user to be logged in (session check)
 */

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to update tasks']);
    exit;
}

// Get and sanitize input data
$task_id     = intval($_POST['task_id'] ?? 0);
$title       = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$status      = trim($_POST['status'] ?? '');
$priority    = trim($_POST['priority'] ?? '');
$category_id = isset($_POST['category_id']) && $_POST['category_id'] !== '' ? intval($_POST['category_id']) : null;
$due_date    = isset($_POST['due_date']) && $_POST['due_date'] !== '' ? trim($_POST['due_date']) : null;

if ($task_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Verify task belongs to user
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

// --- Build dynamic update query ---
$updates = [];
$types   = '';
$params  = [];

if ($title !== '') {
    $updates[] = 'title = ?';
    $types    .= 's';
    $params[]  = $title;
}

if ($description !== '') {
    $updates[] = 'description = ?';
    $types    .= 's';
    $params[]  = $description;
}

if ($status === 'completed' || $status === 'pending') {
    $updates[] = 'status = ?';
    $types    .= 's';
    $params[]  = $status;
}

$valid_priorities = ['low', 'medium', 'high', 'urgent'];
if (in_array($priority, $valid_priorities)) {
    $updates[] = 'priority = ?';
    $types    .= 's';
    $params[]  = $priority;
}

if ($category_id !== null) {
    $updates[] = 'category_id = ?';
    $types    .= 'i';
    $params[]  = $category_id;
}

// Handle due_date (including clearing it)
if (isset($_POST['due_date'])) {
    if ($due_date === '' || preg_match('/^\d{4}-\d{2}-\d{2}$/', $due_date)) {
        $updates[] = 'due_date = ?';
        $types    .= 's';
        $params[]  = $due_date === '' ? null : $due_date;
    }
}

if (empty($updates)) {
    echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
    exit;
}

// Add WHERE clause params
$types  .= 'ii';
$params[] = $task_id;
$params[] = $user_id;

$sql = 'UPDATE tasks SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?';
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Task updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update task']);
}

$stmt->close();
$conn->close();
?>
