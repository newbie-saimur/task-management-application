-- =============================================
-- Task Management System - Database Schema (v2.0)
-- Enhanced with: Priority, Due Date, Categories
-- =============================================
-- Run this SQL in phpMyAdmin to create/update the database.
-- =============================================

-- Step 1: Create the database
CREATE DATABASE IF NOT EXISTS task_management;

-- Step 2: Select the database
USE task_management;

-- Step 3: Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 4: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3498db',  -- Hex color for category badge
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 5: Create tasks table (enhanced)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'completed') DEFAULT 'pending',
    due_date DATE DEFAULT NULL,
    position INT DEFAULT 0,  -- For drag & drop ordering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Foreign key relationships
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 6: Create a stored procedure to auto-generate default categories for new users
-- This runs ONCE per user after their first login (via PHP, not SQL trigger)
-- For simplicity, categories are created dynamically by the frontend on first visit.
-- No static INSERT here because categories are user-specific and user_id must exist.
