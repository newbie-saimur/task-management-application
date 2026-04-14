<?php
/**
 * Get Dashboard Statistics API
 * 
 * Returns JSON response with:
 *   - Total tasks, completed, pending counts
 *   - Tasks by priority
 *   - Tasks by category
 *   - Overdue tasks count
 * Requires user to be logged in
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
$today = date('Y-m-d');

// --- Total tasks ---
$total_result = $conn->query("SELECT COUNT(*) as count FROM tasks WHERE user_id = $user_id");
$total = $total_result->fetch_assoc()['count'];

// --- Completed tasks ---
$completed_result = $conn->query("SELECT COUNT(*) as count FROM tasks WHERE user_id = $user_id AND status = 'completed'");
$completed = $completed_result->fetch_assoc()['count'];

// --- Pending tasks ---
$pending_result = $conn->query("SELECT COUNT(*) as count FROM tasks WHERE user_id = $user_id AND status = 'pending'");
$pending = $pending_result->fetch_assoc()['count'];

// --- Overdue tasks (pending + past due date) ---
$overdue_result = $conn->query("SELECT COUNT(*) as count FROM tasks WHERE user_id = $user_id AND status = 'pending' AND due_date IS NOT NULL AND due_date < '$today'");
$overdue = $overdue_result->fetch_assoc()['count'];

// --- Tasks by priority ---
$priority_result = $conn->query("SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = $user_id GROUP BY priority");
$by_priority = [];
while ($row = $priority_result->fetch_assoc()) {
    $by_priority[$row['priority']] = intval($row['count']);
}

// Ensure all priorities exist in response
$by_priority = [
    'low'    => $by_priority['low'] ?? 0,
    'medium' => $by_priority['medium'] ?? 0,
    'high'   => $by_priority['high'] ?? 0,
    'urgent' => $by_priority['urgent'] ?? 0
];

// --- Tasks by category ---
$category_result = $conn->query("SELECT c.name, c.color, COUNT(t.id) as count FROM categories c LEFT JOIN tasks t ON c.id = t.category_id AND t.user_id = $user_id WHERE c.user_id = $user_id GROUP BY c.id");
$by_category = [];
while ($row = $category_result->fetch_assoc()) {
    $by_category[] = [
        'name'  => $row['name'],
        'color' => $row['color'],
        'count' => intval($row['count'])
    ];
}

// --- Recent activity (last 5 tasks) ---
$recent_result = $conn->query("SELECT id, title, status, created_at FROM tasks WHERE user_id = $user_id ORDER BY created_at DESC LIMIT 5");
$recent = [];
while ($row = $recent_result->fetch_assoc()) {
    $recent[] = $row;
}

$conn->close();

echo json_encode([
    'success'     => true,
    'stats'       => [
        'total'     => intval($total),
        'completed' => intval($completed),
        'pending'   => intval($pending),
        'overdue'   => intval($overdue)
    ],
    'by_priority' => $by_priority,
    'by_category' => $by_category,
    'recent'      => $recent
]);
?>
