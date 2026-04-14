/** Dashboard Application v2.0 - Task Management UI Layer */

// Application state: tracks filters, pagination, and UI interactions
const state = {
    currentFilter: 'all',
    currentCategory: 'all',
    currentPriority: 'all',
    currentPage: 1,
    limit: 10,
    categories: [],
    draggedTaskId: null
};

// DOM element references - cached for performance
const elements = {
    addTaskForm: document.getElementById('addTaskForm'),
    tasksList: document.getElementById('tasksList'),
    taskCount: document.getElementById('taskCount'),
    welcomeUser: document.getElementById('welcomeUser'),
    logoutBtn: document.getElementById('logoutBtn'),
    editModal: document.getElementById('editModal'),
    closeModalBtn: document.getElementById('closeModal'),
    cancelEditBtn: document.getElementById('cancelEdit'),
    editTaskForm: document.getElementById('editTaskForm'),
    filterButtons: document.querySelectorAll('[data-filter]'),
    categoryFilter: document.getElementById('categoryFilter'),
    priorityFilter: document.getElementById('priorityFilter'),
    pagination: document.getElementById('pagination'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    toastContainer: document.getElementById('toastContainer'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    statTotal: document.getElementById('statTotal'),
    statCompleted: document.getElementById('statCompleted'),
    statPending: document.getElementById('statPending'),
    statOverdue: document.getElementById('statOverdue'),
    taskCategory: document.getElementById('taskCategory'),
    editTaskCategory: document.getElementById('editTaskCategory')
};

// Initialize application
checkAuth();
initDarkMode();

// Attach event listeners
if (elements.addTaskForm) elements.addTaskForm.addEventListener('submit', addTask);
if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
if (elements.darkModeToggle) elements.darkModeToggle.addEventListener('click', toggleDarkMode);

// Status Filter Buttons
elements.filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        elements.filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        state.currentFilter = this.dataset.filter;
        state.currentPage = 1;
        loadTasks();
    });
});

if (elements.categoryFilter) {
    elements.categoryFilter.addEventListener('change', function() {
        state.currentCategory = this.value;
        state.currentPage = 1;
        loadTasks();
    });
}
if (elements.priorityFilter) {
    elements.priorityFilter.addEventListener('change', function() {
        state.currentPriority = this.value;
        state.currentPage = 1;
        loadTasks();
    });
}
if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', closeEditModal);
if (elements.cancelEditBtn) elements.cancelEditBtn.addEventListener('click', closeEditModal);
if (elements.editModal) {
    elements.editModal.addEventListener('click', function(e) {
        if (e.target === elements.editModal) closeEditModal();
    });
}
if (elements.editTaskForm) elements.editTaskForm.addEventListener('submit', updateTask);

/** API Calls & Task Operations */

/**
 * Verify authentication and initialize dashboard
 * Checks session validity by attempting to fetch a single task.
 * If user is not logged in, redirects to login page.
 * On success, loads stats, categories, and tasks in parallel for performance.
 */
async function checkAuth() {
    try {
        const response = await fetch('php/getTasks.php?status=all&page=1&limit=1');
        const data = await response.json();
        
        if (!data.success && data.message.includes('logged in')) {
            window.location.href = 'login.html';
            return;
        }
        
        // Load username from session storage
        const username = sessionStorage.getItem('username');
        if (username) {
            elements.welcomeUser.textContent = 'Welcome, ' + username + '!';
        }
        
        // Initialize dashboard
        await Promise.all([
            loadStats(),
            loadCategories(),
            loadTasks()
        ]);
        
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
}

/**
 * Load dashboard statistics
 */
async function loadStats() {
    try {
        const response = await fetch('php/getStats.php');
        const data = await response.json();
        
        if (data.success) {
            const { total, completed, pending, overdue } = data.stats;
            
            // Animate number counting
            animateNumber(elements.statTotal, total);
            animateNumber(elements.statCompleted, completed);
            animateNumber(elements.statPending, pending);
            animateNumber(elements.statOverdue, overdue);
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

/**
 * Animate number counting from 0 to target value
 * Used for stat card counters
 */
function animateNumber(element, target) {
    let current = 0;
    const increment = Math.ceil(target / 30);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current;
    }, 30);
}

/**
 * Load categories from server and populate select dropdowns
 */
async function loadCategories() {
    try {
        const response = await fetch('php/getCategories.php');
        const data = await response.json();
        
        if (data.success) {
            state.categories = data.categories;
            
            // Populate add task category select
            if (elements.taskCategory) {
                elements.taskCategory.innerHTML = '<option value="">No Category</option>';
                data.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    elements.taskCategory.appendChild(option);
                });
            }
            
            // Populate edit modal category select
            if (elements.editTaskCategory) {
                elements.editTaskCategory.innerHTML = '<option value="">No Category</option>';
                data.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    elements.editTaskCategory.appendChild(option);
                });
            }
            
            // Populate category filter
            if (elements.categoryFilter) {
                elements.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
                data.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    elements.categoryFilter.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Load categories error:', error);
    }
}

/**
 * Load tasks with filters and pagination
 */
async function loadTasks() {
    showLoading();
    
    try {
        const url = `php/getTasks.php?status=${state.currentFilter}&category=${state.currentCategory}&priority=${state.currentPriority}&page=${state.currentPage}&limit=${state.limit}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            elements.tasksList.innerHTML = '';
            
            // Update task count display
            elements.taskCount.textContent = `Showing ${data.count} of ${data.total} task${data.total !== 1 ? 's' : ''}`;
            
            if (data.count === 0) {
                elements.tasksList.innerHTML = `<p class="no-tasks">${getEmptyMessage()}</p>`;
            } else {
                // Render each task with animation delay
                data.tasks.forEach((task, index) => {
                    const taskCard = createTaskCard(task);
                    taskCard.style.animationDelay = `${index * 0.05}s`;
                    elements.tasksList.appendChild(taskCard);
                });
                
                // Initialize drag and drop
                initDragAndDrop();
            }
            
            // Update pagination
            updatePagination(data);
            
            // Refresh stats
            loadStats();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to load tasks', 'error');
        console.error('Load tasks error:', error);
    } finally {
        hideLoading();
    }
}

/**
 * Create a task card HTML element
 * @param {Object} task - Task data
 * @returns {HTMLElement}
 */
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority}${task.status === 'completed' ? ' completed' : ''}`;
    card.dataset.taskId = task.id;
    card.draggable = true;
    
    const createdDate = new Date(task.created_at).toLocaleDateString();
    const isOverdue = task.due_date && task.status === 'pending' && new Date(task.due_date) < new Date(new Date().toDateString());
    
    let dueDateHtml = '';
    if (task.due_date) {
        const dueDate = new Date(task.due_date).toLocaleDateString();
        dueDateHtml = `<span class="due-date-badge ${isOverdue ? 'overdue' : ''}">📅 ${dueDate}${isOverdue ? ' (Overdue)' : ''}</span>`;
    }
    
    let categoryHtml = '';
    if (task.category_name) {
        categoryHtml = `<span class="category-badge" style="background-color: ${task.category_color}">${escapeHtml(task.category_name)}</span>`;
    }
    
    card.innerHTML = `
        <div class="task-info">
            <div class="task-title-text">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                ${categoryHtml}
                ${dueDateHtml}
                <span>Created: ${createdDate}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="btn ${task.status === 'completed' ? 'btn-warning' : 'btn-success'} btn-tiny" onclick="toggleStatus(${task.id}, '${task.status}')">
                ${task.status === 'completed' ? '↩️ Undo' : '✅ Complete'}
            </button>
            <button class="btn btn-warning btn-tiny" onclick="openEditModal(${task.id})">✏️ Edit</button>
            <button class="btn btn-danger btn-tiny" onclick="deleteTask(${task.id})">🗑️ Delete</button>
        </div>
    `;
    
    return card;
}

/**
 * Add a new task
 */
async function addTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const category_id = document.getElementById('taskCategory').value;
    const due_date = document.getElementById('taskDueDate').value;
    
    if (!title) {
        showToast('Validation Error', 'Task title is required', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority);
    if (category_id) formData.append('category_id', category_id);
    if (due_date) formData.append('due_date', due_date);
    
    try {
        const response = await fetch('php/addTask.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Success', 'Task added successfully!', 'success');
            elements.addTaskForm.reset();
            document.getElementById('taskPriority').value = 'medium';
            loadTasks();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to add task', 'error');
        console.error('Add task error:', error);
    }
}

/**
 * Toggle task status
 */
async function toggleStatus(taskId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('status', newStatus);
    
    try {
        const response = await fetch('php/updateTask.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Status Updated', `Task marked as ${newStatus}`, 'success');
            loadTasks();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to update task', 'error');
        console.error('Toggle status error:', error);
    }
}

/**
 * Fetch and populate task data in modal + display for editing
 * Parses DOM card data (since full task data not available client-side)
 * then displays modal with pre-filled form values
 */
async function openEditModal(taskId) {
    // Find task data from current list
    const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
    if (!taskCard) return;
    
    // For full data, we need to fetch it - but we can parse from the card
    const title = taskCard.querySelector('.task-title-text').textContent;
    const descriptionEl = taskCard.querySelector('.task-description');
    const description = descriptionEl ? descriptionEl.textContent : '';
    const priorityBadge = taskCard.querySelector('.priority-badge');
    const priority = priorityBadge ? priorityBadge.textContent : 'medium';
    
    // Set form values
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('editTaskTitle').value = title;
    document.getElementById('editTaskDescription').value = description;
    document.getElementById('editTaskPriority').value = priority;
    
    // Show modal
    elements.editModal.classList.remove('hidden');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    elements.editModal.classList.add('hidden');
    elements.editTaskForm.reset();
}

/**
 * Update an existing task
 */
async function updateTask(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const status = document.getElementById('editTaskStatus').value;
    const category_id = document.getElementById('editTaskCategory').value;
    const due_date = document.getElementById('editTaskDueDate').value;
    
    if (!title) {
        showToast('Validation Error', 'Task title is required', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority);
    formData.append('status', status);
    formData.append('category_id', category_id);
    formData.append('due_date', due_date);
    
    try {
        const response = await fetch('php/updateTask.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Success', 'Task updated successfully!', 'success');
            closeEditModal();
            loadTasks();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to update task', 'error');
        console.error('Update task error:', error);
    }
}

/**
 * Delete a task
 */
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    const formData = new FormData();
    formData.append('task_id', taskId);
    
    try {
        const response = await fetch('php/deleteTask.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Deleted', 'Task deleted successfully', 'success');
            loadTasks();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to delete task', 'error');
        console.error('Delete task error:', error);
    }
}

/**
 * Logout user
 */
async function logout() {
    try {
        await fetch('php/logout.php', { method: 'POST' });
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        window.location.href = 'login.html';
    }
}

// ==========================================
// DRAG AND DROP
// ==========================================

/**
 * Initialize drag and drop for task cards
 */
function initDragAndDrop() {
    const cards = document.querySelectorAll('.task-card');
    
    cards.forEach(card => {
        // Drag start
        card.addEventListener('dragstart', function(e) {
            state.draggedTaskId = this.dataset.taskId;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        // Drag end
        card.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            state.draggedTaskId = null;
            
            // Remove all drag-over classes
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
        
        // Drag over
        card.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });
        
        // Drag leave
        card.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        // Drop
        card.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const targetId = this.dataset.taskId;
            const sourceId = state.draggedTaskId;
            
            if (sourceId && sourceId !== targetId) {
                reorderTasks(sourceId, targetId);
            }
        });
    });
}

/**
 * Update task positions in database after drag & drop
 * Maintains order by finding source and target indices, then reordering the array.
 * Sends updated array to backend which updates 'position' field for each task.
 * Position field enables proper re-querying on page refresh/reload.
 */
async function reorderTasks(sourceId, targetId) {
    // Get current task order from DOM
    const cards = document.querySelectorAll('.task-card');
    const taskIds = Array.from(cards).map(card => card.dataset.taskId);
    
    // Find indices
    const sourceIndex = taskIds.indexOf(sourceId);
    const targetIndex = taskIds.indexOf(targetId);
    
    // Reorder array
    taskIds.splice(sourceIndex, 1);
    taskIds.splice(targetIndex, 0, sourceId);
    
    try {
        const response = await fetch('php/reorderTasks.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskIds)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Reordered', 'Task order updated', 'info');
        }
    } catch (error) {
        console.error('Reorder error:', error);
    }
}

// ==========================================
// PAGINATION
// ==========================================

/**
 * Update pagination controls
 */
function updatePagination(data) {
    elements.pagination.innerHTML = '';
    
    if (data.total_pages <= 1) {
        elements.pagination.classList.add('hidden');
        return;
    }
    
    elements.pagination.classList.remove('hidden');
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn-page';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.onclick = () => {
        state.currentPage--;
        loadTasks();
    };
    elements.pagination.appendChild(prevBtn);
    
    // Page numbers (show max 5 pages around current)
    const startPage = Math.max(1, state.currentPage - 2);
    const endPage = Math.min(data.total_pages, state.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn-page ${i === state.currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            state.currentPage = i;
            loadTasks();
        };
        elements.pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-page';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = state.currentPage === data.total_pages;
    nextBtn.onclick = () => {
        state.currentPage++;
        loadTasks();
    };
    elements.pagination.appendChild(nextBtn);
}

/** Dark Mode Management */

/**
 * Initialize dark mode setting from browser storage
 * Applies 'dark-mode' class to body if enabled
 */
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (elements.darkModeToggle) {
            elements.darkModeToggle.textContent = '☀️';
        }
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    if (elements.darkModeToggle) {
        elements.darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    }
    
    showToast('Theme', isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

/** Toast Notifications - User Feedback */

/**
 * Display toast notification with icon and auto-dismiss
 * Types: success (✅), error (❌), warning (⚠️), info (ℹ️)
 * Auto-removes after 4 seconds or when close button clicked
 */
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

/**
 * Remove a toast with animation
 */
function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/** Utility Functions */

function showLoading() {
    if (elements.loadingSpinner) {
        elements.loadingSpinner.classList.remove('hidden');
    }
}

function hideLoading() {
    if (elements.loadingSpinner) {
        elements.loadingSpinner.classList.add('hidden');
    }
}

function getEmptyMessage() {
    if (state.currentFilter === 'completed') {
        return 'No completed tasks yet! Keep working! 💪';
    } else if (state.currentFilter === 'pending') {
        return 'No pending tasks. You\'re all caught up! 🎉';
    } else if (state.currentCategory !== 'all') {
        return 'No tasks in this category.';
    } else {
        return 'No tasks yet. Add your first task above! ✨';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
