<?php
/**
 * User Logout API
 * 
 * Destroys the current session and returns a JSON response
 */

// Start the existing session
session_start();

// Unset all session variables
$_SESSION = [];

// Delete the session cookie if it exists
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Destroy the session
session_destroy();

// Return success response
echo json_encode(['success' => true, 'message' => 'Logout successful']);
?>
