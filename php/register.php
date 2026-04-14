<?php
/**
 * User Registration API
 * 
 * Accepts POST request with: username, email, password
 * Returns JSON response with success/failure message
 */

// Start session to track logged-in users
session_start();

// Include database connection
require_once 'db.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get and sanitize input data
$username = trim($_POST['username'] ?? '');
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

// --- Input Validation ---

// Check if any field is empty
if (empty($username) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

// Validate username length (3-50 characters)
if (strlen($username) < 3 || strlen($username) > 50) {
    echo json_encode(['success' => false, 'message' => 'Username must be between 3 and 50 characters']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Validate password length (minimum 6 characters)
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
    exit;
}

// --- Check if username or email already exists ---

// Use prepared statements to prevent SQL injection
$stmt = $conn->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
$stmt->bind_param('ss', $username, $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
    $stmt->close();
    exit;
}
$stmt->close();

// --- Hash the password for secure storage ---
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// --- Insert new user into database ---
$stmt = $conn->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $username, $email, $password_hash);

if ($stmt->execute()) {
    // Registration successful — get the new user's ID
    $new_user_id = $stmt->insert_id;
    
    // Auto-create default categories for this user
    $default_categories = [
        ['Study', '#3498db'],
        ['Personal', '#27ae60'],
        ['Work', '#e67e22'],
        ['Health', '#e74c3c'],
        ['Shopping', '#9b59b6'],
        ['Other', '#95a5a6']
    ];
    
    $cat_stmt = $conn->prepare('INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)');
    foreach ($default_categories as $cat) {
        $cat_stmt->bind_param('iss', $new_user_id, $cat[0], $cat[1]);
        $cat_stmt->execute();
    }
    $cat_stmt->close();
    
    echo json_encode(['success' => true, 'message' => 'Registration successful']);
} else {
    // Registration failed
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
}

$stmt->close();
$conn->close();
?>
