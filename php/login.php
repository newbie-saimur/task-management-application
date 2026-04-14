<?php
/**
 * User Login API
 * 
 * Accepts POST request with: username (or email), password
 * Returns JSON response with success/failure message
 * On success, stores user info in PHP session
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
$password = $_POST['password'] ?? '';

// --- Input Validation ---

// Check if fields are empty
if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required']);
    exit;
}

// --- Find user in database by username or email ---
// Using prepared statements to prevent SQL injection
$stmt = $conn->prepare('SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?');
$stmt->bind_param('ss', $username, $username);
$stmt->execute();
$result = $stmt->get_result();

// Check if user exists
if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    $stmt->close();
    exit;
}

// Fetch user data
$user = $result->fetch_assoc();
$stmt->close();

// --- Verify the password ---
if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    $conn->close();
    exit;
}

// --- Login successful: Set session variables ---
$_SESSION['user_id']   = $user['id'];
$_SESSION['username']  = $user['username'];
$_SESSION['logged_in'] = true;

// Return success response with username
echo json_encode(['success' => true, 'message' => 'Login successful', 'username' => $user['username']]);

$conn->close();
?>
