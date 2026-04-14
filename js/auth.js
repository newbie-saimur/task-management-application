/** Authentication forms - Login & Registration handlers */

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

/** Login Form Handler */
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
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
