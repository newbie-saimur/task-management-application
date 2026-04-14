<?php
/**
 * Database Connection File
 * 
 * This file establishes a connection to the MySQL database using MySQLi.
 * It is included by all PHP API files that need database access.
 */

// Database configuration constants
define('DB_HOST', 'localhost');       // Database host (usually localhost for XAMPP)
define('DB_USER', 'root');            // Database username (default root for XAMPP)
define('DB_PASS', '');                // Database password (empty by default for XAMPP)
define('DB_NAME', 'task_management'); // Database name

// Create a new MySQLi connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check if connection was successful
if ($conn->connect_error) {
    // Return JSON error response and stop execution
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Set character set to utf8mb4 for proper encoding
$conn->set_charset('utf8mb4');
?>
