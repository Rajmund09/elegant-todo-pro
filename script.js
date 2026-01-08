
// App State
const STORAGE_KEY = 'todo_elegant_pro';
const state = {
  tasks: [],
  filter: 'all',
  currentPriority: 'medium',
  focusMode: false,
  sortBy: 'date',
  sortOrder: 'desc'
};

// DOM Elements
const newTaskInput = document.getElementById('new-task');
const addBtn = document.getElementById('add-btn');
const tasksList = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const themeBtn = document.getElementById('theme-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const focusModeBtn = document.getElementById('focus-mode');
const sortBtn = document.getElementById('sort-tasks');
const dateDisplay = document.getElementById('date-display');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const notificationContainer = document.getElementById('notification-container');

// Stats Elements
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const priorityTasksEl = document.getElementById('priority-tasks');
const tasksCountEl = document.getElementById('tasks-count');

// Initialize
function init() {
  loadTasks();
  updateDate();
  render();
  setupEventListeners();
  showNotification('Welcome to Elegant TODO Pro!', 'success');
}

// Update current date
function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

// Task Management
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state.tasks = saved ? JSON.parse(saved) : [];
  } catch (error) {
    state.tasks = [];
    console.error('Error loading tasks:', error);
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function createTask(text, priority = state.currentPriority) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    priority: priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    notes: ''
  };
}

function addTask() {
  const text = newTaskInput.value.trim();
  if (!text) {
    showNotification('Please enter a task', 'warning');
    newTaskInput.focus();
    return;
  }

  const task = createTask(text);
  state.tasks.unshift(task);
  saveTasks();
  render();
  newTaskInput.value = '';
  newTaskInput.focus();
  showNotification('Task added successfully', 'success');
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    saveTasks();
    render();
    showNotification(`Task marked as ${task.completed ? 'completed' : 'active'}`, 'info');
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  render();
  showNotification('Task deleted', 'info');
}

function editTask(id, newText) {
  const task = state.tasks.find(t => t.id === id);
  if (task && newText.trim()) {
    task.text = newText.trim();
    task.updatedAt = new Date().toISOString();
    saveTasks();
    render();
    showNotification('Task updated', 'success');
  }
}

function clearCompletedTasks() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  state.tasks = state.tasks.filter(t => !t.completed);
  saveTasks();
  render();
  showNotification(`Cleared ${completedCount} completed tasks`, 'info');
}

function setPriority(id, priority) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.priority = priority;
    task.updatedAt = new Date().toISOString();
    saveTasks();
    render();
    showNotification(`Priority set to ${priority}`, 'info');
  }
}

// Filtering & Sorting
function filterTasks() {
  let filtered = [...state.tasks];

  switch (state.filter) {
    case 'active':
      filtered = filtered.filter(t => !t.completed);
      break;
    case 'completed':
      filtered = filtered.filter(t => t.completed);
      break;
    case 'high':
      filtered = filtered.filter(t => t.priority === 'high');
      break;
    default:
      // 'all' - no filter
      break;
  }

  // Sort tasks
  filtered.sort((a, b) => {
    if (state.sortBy === 'date') {
      return state.sortOrder === 'desc'
        ? new Date(b.updatedAt) - new Date(a.updatedAt)
        : new Date(a.updatedAt) - new Date(b.updatedAt);
    } else if (state.sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return state.sortOrder === 'desc'
        ? priorityOrder[b.priority] - priorityOrder[a.priority]
        : priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  return filtered;
}

// Stats Calculation
function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const highPriority = state.tasks.filter(t => t.priority === 'high' && !t.completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  pendingTasksEl.textContent = pending;
  priorityTasksEl.textContent = highPriority;
  tasksCountEl.textContent = `${total} task${total !== 1 ? 's' : ''}`;

  progressFill.style.width = `${progress}%`;
  progressPercent.textContent = `${progress}%`;
}

// Rendering
function render() {
  const filteredTasks = filterTasks();
  updateStats();

  // Show/hide empty state
  if (filteredTasks.length === 0 && state.filter === 'all') {
    emptyState.style.display = 'block';
    tasksList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    tasksList.style.display = 'block';
  }

  // Render tasks
  tasksList.innerHTML = '';
  filteredTasks.forEach(task => {
    const taskEl = createTaskElement(task);
    tasksList.appendChild(taskEl);
  });

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter);
  });

  // Update priority buttons
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === state.currentPriority);
  });

  // Update focus mode button
  focusModeBtn.innerHTML = state.focusMode
    ? '<i class="fas fa-times"></i><span>Exit Focus</span>'
    : '<i class="fas fa-crosshairs"></i><span>Focus Mode</span>';

  // Toggle focus mode class
  document.body.classList.toggle('focus-mode', state.focusMode);
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item ${state.focusMode && !task.completed ? 'focused' : ''}`;
  li.dataset.id = task.id;

  // Task checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Task content
  const content = document.createElement('div');
  content.className = 'task-content';

  const text = document.createElement('div');
  text.className = `task-text ${task.completed ? 'completed' : ''}`;
  text.textContent = task.text;
  text.addEventListener('dblclick', () => startEditTask(task.id, text));

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  const priority = document.createElement('span');
  priority.className = `task-priority priority-${task.priority}`;
  priority.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

  const date = document.createElement('span');
  date.className = 'task-date';
  date.innerHTML = `<i class="far fa-calendar"></i> ${formatDate(task.updatedAt)}`;

  meta.appendChild(priority);
  meta.appendChild(date);
  content.appendChild(text);
  content.appendChild(meta);

  // Task actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const priorityBtn = document.createElement('button');
  priorityBtn.className = 'task-btn';
  priorityBtn.innerHTML = '<i class="fas fa-flag"></i>';
  priorityBtn.title = 'Change Priority';
  priorityBtn.addEventListener('click', () => cyclePriority(task.id));

  const editBtn = document.createElement('button');
  editBtn.className = 'task-btn';
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.title = 'Edit Task';
  editBtn.addEventListener('click', () => startEditTask(task.id, text));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-btn';
  deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  deleteBtn.title = 'Delete Task';
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  actions.appendChild(priorityBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  // Assemble task element
  li.appendChild(checkbox);
  li.appendChild(content);
  li.appendChild(actions);

  return li;
}

function startEditTask(id, textElement) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'task-input';
  input.style.margin = '0';
  input.style.width = '100%';
  input.style.border = '1px solid var(--primary)';

  textElement.replaceWith(input);
  input.focus();
  input.select();

  function finishEdit() {
    const newText = input.value.trim();
    if (newText && newText !== task.text) {
      editTask(id, newText);
    } else {
      render();
    }
  }

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finishEdit();
    if (e.key === 'Escape') render();
  });
}

function cyclePriority(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const priorities = ['low', 'medium', 'high'];
  const currentIndex = priorities.indexOf(task.priority);
  const nextIndex = (currentIndex + 1) % priorities.length;
  setPriority(id, priorities[nextIndex]);
}

// Date formatting
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;

  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  if (type === 'error') icon = 'exclamation-circle';

  notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
      `;

  notificationContainer.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('hiding');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Theme Toggle
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  themeBtn.innerHTML = isDark
    ? '<i class="fas fa-sun"></i><span>Light Mode</span>'
    : '<i class="fas fa-moon"></i><span>Dark Mode</span>';

  localStorage.setItem('todo_theme', isDark ? 'dark' : 'light');
  showNotification(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'info');

  // Force re-render for theme-specific adjustments
  render();
}

// Focus Mode
function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  render();
  showNotification(state.focusMode ? 'Focus mode activated' : 'Focus mode deactivated', 'info');
}

// Sort Tasks
function toggleSort() {
  if (state.sortBy === 'date') {
    state.sortBy = 'priority';
    state.sortOrder = 'desc';
    showNotification('Sorted by priority', 'info');
  } else {
    state.sortBy = 'date';
    state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
    showNotification(`Sorted by date (${state.sortOrder})`, 'info');
  }
  render();
}

// Event Listeners Setup
function setupEventListeners() {
  // Add task
  addBtn.addEventListener('click', addTask);
  newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });

  // Priority selection
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentPriority = btn.dataset.priority;
      render();
    });
  });

  // Filter selection
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      render();
    });
  });

  // Theme toggle
  themeBtn.addEventListener('click', toggleTheme);

  // Clear completed
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);

  // Focus mode
  focusModeBtn.addEventListener('click', toggleFocusMode);

  // Sort tasks
  sortBtn.addEventListener('click', toggleSort);
}

// Load saved theme
const savedTheme = localStorage.getItem('todo_theme') || 'light';
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  themeBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
