/**
 * Authentication JavaScript
 * 
 * Handles login and registration form submissions using fetch() API.
 * Communicates with PHP backend and redirects on success.
 */

// Determine which page we're on by checking for form elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// ==========================================
// LOGIN FORM HANDLER
// ==========================================
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent default form submission
        
        // Clear previous errors
        clearErrors();
        
        // Get form data
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Client-side validation
        let hasError = false;
        
        if (!username) {
            showError('usernameError', 'Username is required');
            hasError = true;
        }
        
        if (!password) {
            showError('passwordError', 'Password is required');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Prepare data to send to server
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        try {
            // Send POST request to login.php API
            const response = await fetch('php/login.php', {
                method: 'POST',
                body: formData
            });
            
            // Parse JSON response from PHP
            const data = await response.json();
            
            if (data.success) {
                // Login successful - show success message
                showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Login failed - show error message
                showMessage(data.message, 'error');
            }
        } catch (error) {
            // Network or server error
            showMessage('An error occurred. Please try again.', 'error');
            console.error('Login error:', error);
        }
    });
}

// ==========================================
// REGISTRATION FORM HANDLER
// ==========================================
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent default form submission
        
        // Clear previous errors
        clearErrors();
        
        // Get form data
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Client-side validation
        let hasError = false;
        
        if (!username) {
            showError('usernameError', 'Username is required');
            hasError = true;
        } else if (username.length < 3) {
            showError('usernameError', 'Username must be at least 3 characters');
            hasError = true;
        }
        
        if (!email) {
            showError('emailError', 'Email is required');
            hasError = true;
        } else if (!isValidEmail(email)) {
            showError('emailError', 'Please enter a valid email');
            hasError = true;
        }
        
        if (!password) {
            showError('passwordError', 'Password is required');
            hasError = true;
        } else if (password.length < 6) {
            showError('passwordError', 'Password must be at least 6 characters');
            hasError = true;
        }
        
        if (password !== confirmPassword) {
            showError('confirmPasswordError', 'Passwords do not match');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Prepare data to send to server
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        
        try {
            // Send POST request to register.php API
            const response = await fetch('php/register.php', {
                method: 'POST',
                body: formData
            });
            
            // Parse JSON response from PHP
            const data = await response.json();
            
            if (data.success) {
                // Registration successful - show success message
                showMessage('Registration successful! Redirecting to login...', 'success');
                
                // Redirect to login page after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                // Registration failed - show error message
                showMessage(data.message, 'error');
            }
        } catch (error) {
            // Network or server error
            showMessage('An error occurred. Please try again.', 'error');
            console.error('Registration error:', error);
        }
    });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Display a message in the message div
 * @param {string} text - Message text to display
 * @param {string} type - 'success' or 'error'
 */
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type; // Add class: message success or message error
    messageDiv.classList.remove('hidden');
}

/**
 * Show field-specific error message
 * @param {string} elementId - ID of the error span element
 * @param {string} text - Error message
 */
function showError(elementId, text) {
    const errorSpan = document.getElementById(elementId);
    if (errorSpan) {
        errorSpan.textContent = text;
    }
}

/**
 * Clear all error messages
 */
function clearErrors() {
    // Clear the main message div
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.className = 'message hidden';
        messageDiv.textContent = '';
    }
    
    // Clear all field error spans
    const errors = document.querySelectorAll('.error');
    errors.forEach(error => {
        error.textContent = '';
    });
}

/**
 * Validate email format using regex
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
