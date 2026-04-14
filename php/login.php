<?php
/**
 * Login API - Authenticates user and starts session
 * Accepts: username (or email), password
 * Returns: JSON { success, message, user data }
 */

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required']);
    exit;
}

$stmt = $conn->prepare('SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?');
$stmt->bind_param('ss', $username, $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    $stmt->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Verify password
if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    $conn->close();
    exit;
}

// Set session variables on successful authentication
$_SESSION['user_id']   = $user['id'];
$_SESSION['username']  = $user['username'];
$_SESSION['logged_in'] = true;

echo json_encode(['success' => true, 'message' => 'Login successful', 'username' => $user['username']]);
$conn->close();
?>
