<?php
/**
 * Add Task API - Creates new task for authenticated user
 * Accepts: title*, description, priority, category_id, due_date
 * Returns: JSON { success, message, task_id }
 */

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to add tasks']);
    exit;
}

$title       = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$priority    = trim($_POST['priority'] ?? 'medium');
$category_id = !empty($_POST['category_id']) ? intval($_POST['category_id']) : null;
$due_date    = !empty($_POST['due_date']) ? trim($_POST['due_date']) : null;

if (empty($title)) {
    echo json_encode(['success' => false, 'message' => 'Task title is required']);
    exit;
}

if (strlen($title) > 200) {
    echo json_encode(['success' => false, 'message' => 'Task title must be less than 200 characters']);
    exit;
}

$valid_priorities = ['low', 'medium', 'high', 'urgent'];
if (!in_array($priority, $valid_priorities)) {
    $priority = 'medium';
}

if ($due_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $due_date)) {
    echo json_encode(['success' => false, 'message' => 'Invalid due date format (use YYYY-MM-DD)']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get the highest position value for ordering (drag & drop)
$pos_result = $conn->query("SELECT COALESCE(MAX(position), 0) as max_pos FROM tasks WHERE user_id = $user_id");
$position = $pos_result->fetch_assoc()['max_pos'] + 1;

// --- Insert task into database ---
$stmt = $conn->prepare('INSERT INTO tasks (user_id, category_id, title, description, priority, status, due_date, position) VALUES (?, ?, ?, ?, ?, "pending", ?, ?)');
$stmt->bind_param('iissssi', $user_id, $category_id, $title, $description, $priority, $due_date, $position);

if ($stmt->execute()) {
    $task_id = $stmt->insert_id;
    
    // Get category name if exists
    $category_name = null;
    if ($category_id) {
        $cat_stmt = $conn->prepare('SELECT name FROM categories WHERE id = ? AND user_id = ?');
        $cat_stmt->bind_param('ii', $category_id, $user_id);
        $cat_stmt->execute();
        $cat_result = $cat_stmt->get_result();
        if ($cat_result->num_rows > 0) {
            $category_name = $cat_result->fetch_assoc()['name'];
        }
        $cat_stmt->close();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Task added successfully',
        'task' => [
            'id'          => $task_id,
            'title'       => $title,
            'description' => $description,
            'priority'    => $priority,
            'status'      => 'pending',
            'category_id' => $category_id,
            'category_name' => $category_name,
            'due_date'    => $due_date,
            'position'    => $position,
            'created_at'  => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to add task']);
}

$stmt->close();
$conn->close();
?>
