<?php
/**
 * Logout API - Destroys current session
 * Returns: JSON { success, message }
 */

session_start();
$_SESSION = [];

if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

session_destroy();
echo json_encode(['success' => true, 'message' => 'Logout successful']);
?>
