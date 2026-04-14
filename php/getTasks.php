<?php
/**
 * Get Tasks API (v2.0)
 * 
 * Accepts GET request with optional query parameters:
 *   - status: all, pending, completed
 *   - category: category_id or all
 *   - priority: low, medium, high, urgent, all
 *   - page: page number (for pagination)
 *   - limit: items per page (default 10)
 * Returns JSON response with tasks for the logged-in user
 */

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to view tasks']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get filter parameters
$filter_status = isset($_GET['status']) ? $_GET['status'] : 'all';
$filter_category = isset($_GET['category']) ? $_GET['category'] : 'all';
$filter_priority = isset($_GET['priority']) ? $_GET['priority'] : 'all';

// Pagination parameters
$page  = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(50, intval($_GET['limit']))) : 10;
$offset = ($page - 1) * $limit;

// --- Build SQL query ---
$sql = 'SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.position, t.created_at, t.updated_at, c.name as category_name, c.color as category_color 
        FROM tasks t 
        LEFT JOIN categories c ON t.category_id = c.id 
        WHERE t.user_id = ?';

$params = [$user_id];
$types = 'i';

// Apply status filter
if ($filter_status === 'pending') {
    $sql .= " AND t.status = 'pending'";
} elseif ($filter_status === 'completed') {
    $sql .= " AND t.status = 'completed'";
}

// Apply category filter
if ($filter_category !== 'all') {
    $sql .= ' AND t.category_id = ?';
    $params[] = intval($filter_category);
    $types .= 'i';
}

// Apply priority filter
if ($filter_priority !== 'all') {
    $sql .= ' AND t.priority = ?';
    $params[] = $filter_priority;
    $types .= 's';
}

// Order by position (for drag & drop) then by newest first
$sql .= ' ORDER BY t.position ASC, t.created_at DESC';

// Add pagination
$sql .= ' LIMIT ? OFFSET ?';
$params[] = $limit;
$params[] = $offset;
$types .= 'ii';

// --- Get total count (for pagination info) ---
$count_sql = 'SELECT COUNT(*) as total FROM tasks WHERE user_id = ?';
$count_params = [$user_id];
$count_types = 'i';

if ($filter_status !== 'all') {
    $count_sql .= " AND status = '$filter_status'";
}
if ($filter_category !== 'all') {
    $count_sql .= ' AND category_id = ' . intval($filter_category);
}
if ($filter_priority !== 'all') {
    $count_sql .= " AND priority = '$filter_priority'";
}

$count_stmt = $conn->prepare($count_sql);
$count_stmt->bind_param($count_types, ...$count_params);
$count_stmt->execute();
$total_count = $count_stmt->get_result()->fetch_assoc()['total'];
$count_stmt->close();

// --- Execute main query ---
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

// Fetch all tasks
$tasks = [];
while ($row = $result->fetch_assoc()) {
    $tasks[] = $row;
}

$stmt->close();
$conn->close();

// Calculate pagination info
$total_pages = ceil($total_count / $limit);

echo json_encode([
    'success'      => true,
    'tasks'        => $tasks,
    'count'        => count($tasks),
    'total'        => $total_count,
    'page'         => $page,
    'limit'        => $limit,
    'total_pages'  => $total_pages,
    'has_more'     => $page < $total_pages
]);
?>
