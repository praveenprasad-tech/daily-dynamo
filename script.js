// Task Manager Class
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        this.checkDeadlines();
        // Check deadlines every minute
        setInterval(() => this.checkDeadlines(), 60000);
    }

    setupEventListeners() {
        // Add task button click
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());

        // Enter key to add task
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const deadlineInput = document.getElementById('deadlineInput');

        // Validation: Check task input
        if (!taskInput.value.trim()) {
            alert('Please enter a task!');
            taskInput.focus();
            return;
        }

        // Validation: Check deadline input
        if (!deadlineInput.value) {
            alert('Please set a deadline!');
            deadlineInput.focus();
            return;
        }

        // Create task object
        const task = {
            id: Date.now(),
            text: taskInput.value.trim(),
            deadline: new Date(deadlineInput.value),
            completed: false,
            createdAt: new Date()
        };

        // Add to tasks array
        this.tasks.push(task);
        this.saveTasks();
        this.render();

        // Clear inputs and focus
        taskInput.value = '';
        deadlineInput.value = '';
        taskInput.focus();
    }

    deleteTask(id) {
        // Ask for confirmation before deleting
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.render();
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    formatDeadline(deadline) {
        const now = new Date();
        const diff = deadline - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (diff < 0) {
            return '⏰ Overdue';
        } else if (days === 0 && hours === 0 && minutes === 0) {
            return '🔴 Due Now!';
        } else if (days === 0 && hours === 0) {
            return `⚠️ ${minutes}m left`;
        } else if (days === 0) {
            return `⚠️ ${hours}h ${minutes}m left`;
        } else {
            return `📅 ${days}d ${hours}h left`;
        }
    }

    checkDeadlines() {
        this.tasks.forEach(task => {
            if (!task.completed && new Date() >= task.deadline) {
                this.notifyDeadline(task);
            }
        });
    }

    notifyDeadline(task) {
        // Browser notification (if permission granted)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Daily Dynamo - Task Deadline! ⏰', {
                body: `Deadline reached: ${task.text}`,
                icon: '⚡'
            });
        }

        // Show popup alert
        alert(`⏰ DEADLINE REACHED!\n\nTask: ${task.text}\n\nDon't forget to complete it!`);
    }

    render() {
        const tasksList = document.getElementById('tasksList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        // Clear current list
        tasksList.innerHTML = '';

        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        // Render each task
        filteredTasks.forEach(task => {
            const isOverdue = !task.completed && new Date() > task.deadline;
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;

            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="taskManager.toggleTask(${task.id})"
                >
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-deadline">${this.formatDeadline(task.deadline)}</div>
                </div>
                <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})">Delete</button>
            `;

            tasksList.appendChild(li);
        });
    }

    escapeHtml(text) {
        // Prevent XSS attacks by escaping HTML characters
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    saveTasks() {
        try {
            localStorage.setItem('dailyDynamoTasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
            alert('Warning: Could not save tasks. Your data may not persist after refresh.');
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('dailyDynamoTasks');
            if (saved) {
                const tasks = JSON.parse(saved);
                // Convert deadline strings back to Date objects
                return tasks.map(t => ({
                    ...t,
                    deadline: new Date(t.deadline),
                    createdAt: new Date(t.createdAt)
                }));
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
        return [];
    }
}

// Initialize Task Manager when DOM is ready
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});

// Request notification permission when page loads
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}