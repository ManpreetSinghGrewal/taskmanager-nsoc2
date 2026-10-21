// Select main DOM elements
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const dateInput = document.getElementById('todo-date');
const priorityInput = document.getElementById('todo-priority');

const filters = document.getElementById('filters');
const filterButtons = document.querySelectorAll('#filters button');
const historyButton = document.getElementById('history-toggle');
const chartsSection = document.getElementById('charts');

const priorityChartCanvas = document.getElementById('priority-chart');
const weeklyChartCanvas = document.getElementById('weekly-chart');
const previousMonthButton = document.getElementById('previous-month');
const nextMonthButton = document.getElementById('next-month');

// Stats and progress bar elements
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statCompleted = document.getElementById('stat-completed');
const statOverdue = document.getElementById('stat-overdue');
const progressPercent = document.getElementById('progress-percent');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressBarWrapper = document.getElementById('progress-bar-wrapper');
const statCards = document.querySelectorAll('.stat-card');

// Task Search and Sort elements
const searchInput = document.getElementById('task-search');
const searchClearButton = document.getElementById('search-clear');
const sortSelect = document.getElementById('task-sort');

// Application State
let tasks = loadTasks();
let priorityChart = null;
let weeklyChart = null;
let chartMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let historyMode = false;
let currentFilter = 'active';
let searchQuery = '';
let currentSort = 'default';
let lastRenderDate = getTodayDate();

const priorityWeights = { high: 3, medium: 2, low: 1 };
// light-dark mode
const themeToggle = document.getElementById('theme-toggle');
function applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    themeToggle.textContent = isLight ? 'Dark mode' : 'Light mode';

    themeToggle.setAttribute(
        'aria-label',
        isLight ? 'Switch to dark mode' : 'Switch to light mode'
    );
    themeToggle.setAttribute('aria-pressed', String(isLight));
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    // Chart styling for readability
    Chart.defaults.color = isLight ? '#1d1d1f' : '#f5f5f7';
    Chart.defaults.borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';

    // Refresh charts if history is open
    if (historyMode) {
        drawPriorityChart();
        drawWeeklyChart();
    }
}
applyTheme(localStorage.getItem('theme') === 'light');
// Switch theme - button is clicked.
themeToggle.addEventListener('click', function () {
    const isLight = !document.body.classList.contains('light-mode');
    applyTheme(isLight);
});

/**
 * Loads valid tasks from browser localStorage.
 */
function loadTasks() {
    try {
        const storedTasks = JSON.parse(localStorage.getItem('tasks'));
        if (!Array.isArray(storedTasks)) return [];
        return storedTasks.filter(isValidTask);
    } catch (error) {
        return [];
    }
}

/**
 * Checks whether a stored record has the required task fields and types.
 */
function isValidTask(task) {
    if (!task || typeof task !== 'object' || Array.isArray(task)) return false;

    const hasValidCompletedAt = task.completedAt === null ||
        (typeof task.completedAt === 'string' && !Number.isNaN(Date.parse(task.completedAt)));

    return typeof task.text === 'string' &&
        task.text.trim() !== '' &&
        typeof task.dueDate === 'string' &&
        ['low', 'medium', 'high'].includes(task.priority) &&
        typeof task.completed === 'boolean' &&
        hasValidCompletedAt;
}

/**
 * Persists current task list to browser localStorage.
 */
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Checks if an active task is overdue using local calendar-day boundaries.
 * Tasks due today or without a due date are not overdue.
 */
function isOverdue(task) {
    return Boolean(task.dueDate && task.dueDate < getTodayDate() && !task.completed);
}

/**
 * Updates UI active status for filter buttons and stat cards.
 */
function updateActiveFilterUI(selectedFilter) {
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === selectedFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    statCards.forEach(card => {
        if (card.dataset.statFilter === selectedFilter) {
            card.classList.add('active-filter');
        } else {
            card.classList.remove('active-filter');
        }
    });
}

/**
 * Calculates and updates productivity statistics and the completion progress bar.
 */
function updateDashboardStats() {
    if (!statTotal || !statActive || !statCompleted || !statOverdue) return;

    const total = tasks.length;
    const active = tasks.filter(task => !task.completed).length;
    const completed = tasks.filter(task => task.completed).length;
    const overdue = tasks.filter(task => isOverdue(task)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    statTotal.textContent = total;
    statActive.textContent = active;
    statCompleted.textContent = completed;
    statOverdue.textContent = overdue;

    if (progressPercent) {
        progressPercent.textContent = `${percent}%`;
    }
    if (progressBarFill) {
        progressBarFill.style.width = `${percent}%`;
    }
    if (progressBarWrapper) {
        progressBarWrapper.setAttribute('aria-valuenow', String(percent));
    }
}

/**
 * Sorts an array of tasks based on the given sort criteria without mutating the original array.
 */
function sortTasks(taskList, sortOption = currentSort) {
    const listCopy = [...taskList];
    if (sortOption === 'default') {
        return listCopy;
    }

    return listCopy.sort((a, b) => {
        if (sortOption === 'dueDate-asc') {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        }
        if (sortOption === 'dueDate-desc') {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return b.dueDate.localeCompare(a.dueDate);
        }
        if (sortOption === 'priority-desc') {
            const weightA = priorityWeights[a.priority] || 0;
            const weightB = priorityWeights[b.priority] || 0;
            return weightB - weightA;
        }
        if (sortOption === 'priority-asc') {
            const weightA = priorityWeights[a.priority] || 0;
            const weightB = priorityWeights[b.priority] || 0;
            return weightA - weightB;
        }
        if (sortOption === 'alphabetical-asc') {
            return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
        }
        if (sortOption === 'alphabetical-desc') {
            return b.text.localeCompare(a.text, undefined, { sensitivity: 'base' });
        }
        return 0;
    });
}

/**
 * Renders task list based on active mode and filter.
 */
function showTasks(filter = historyMode ? currentFilter : 'active') {
    lastRenderDate = getTodayDate();
    currentFilter = filter;
    updateActiveFilterUI(filter);
    list.innerHTML = '';

    const visibleTasks = tasks.filter(function(task) {
        if (filter === 'active') return !task.completed;
        if (filter === 'overdue-task') return isOverdue(task);
        if (filter === 'done') return task.completed;
        return true;
    }).filter(function(task) {
        if (!searchQuery) return true;
        return task.text.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (visibleTasks.length === 0) {
        const emptyState = document.createElement('li');
        emptyState.className = 'empty-state';
        let emptyMsg = 'No tasks found. Add a task above to get started!';
        if (searchQuery) {
            emptyMsg = `🔍 No tasks found matching "${searchQuery}".`;
        } else if (filter === 'active') {
            emptyMsg = tasks.length === 0
                ? 'No active tasks. Add a task above to get started!'
                : '🎉 All caught up! All tasks are completed.';
        } else if (filter === 'done') {
            emptyMsg = 'No completed tasks yet. Finish a task to see it here!';
        } else if (filter === 'overdue-task') {
            emptyMsg = '✨ Excellent! No overdue tasks.';
        }
        emptyState.textContent = emptyMsg;
        list.appendChild(emptyState);
    }

    const sortedVisibleTasks = sortTasks(visibleTasks, currentSort);

    const tasksToRender = filter === 'all'
        ? groupTasksByMonth(sortedVisibleTasks)
        : [{ monthLabel: '', tasks: sortedVisibleTasks }];

    tasksToRender.forEach(function(group) {
        if (group.monthLabel) {
            const monthHeading = document.createElement('li');
            monthHeading.className = 'month-heading';
            monthHeading.textContent = `${group.monthLabel} (${group.tasks.length})`;
            list.appendChild(monthHeading);
        }

        group.tasks.forEach(function(task) {
            const listItem = document.createElement('li');
            const taskText = document.createElement('span');
            const priorityDot = document.createElement('span');
            const taskDetails = document.createElement('span');
            const actionContainer = document.createElement('div');
            actionContainer.className = 'action-buttons';

            listItem.classList.toggle('is-complete', task.completed);

            priorityDot.className = `status-dot priority-${String(task.priority || 'medium').toLowerCase()}`;
            priorityDot.setAttribute('aria-label', `${task.priority || 'Medium'} priority`);
            priorityDot.title = `${task.priority || 'Medium'} priority`;

            taskDetails.className = 'task-details';
            taskText.className = 'task-title';
            taskText.textContent = `${task.text} | Due: ${task.dueDate || 'No date'}`;

            if (isOverdue(task)) {
                const overdueBadge = document.createElement('span');
                overdueBadge.className = 'overdue-badge';
                overdueBadge.textContent = 'Overdue';
                taskDetails.appendChild(overdueBadge);
            }

            taskText.title = 'Double-click to edit this task';

            // Double click inline edit capability
            taskText.addEventListener('dblclick', function() {
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = task.text;
                editInput.className = 'edit-input';

                taskDetails.replaceChild(editInput, taskText);
                editInput.focus();
                editInput.select();

                function saveEdit() {
                    const newText = editInput.value.trim();
                    if (newText !== '') {
                        task.text = newText;
                        saveTasks();
                    }
                    showTasks(filter);
                }

                editInput.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') saveEdit();
                    if (event.key === 'Escape') {
                        editInput.removeEventListener('blur', saveEdit);
                        showTasks(filter);
                    }
                });

                editInput.addEventListener('blur', saveEdit);
            });

            taskDetails.appendChild(taskText);

            if (task.completed) {
                const doneDot = document.createElement('span');
                doneDot.className = 'status-dot done-dot';
                doneDot.setAttribute('aria-label', 'Completed');
                doneDot.title = 'Completed';
                listItem.appendChild(doneDot);
            }

            // Mark completed button
            const doneButton = document.createElement('button');
            doneButton.textContent = task.completed ? 'Mark as active' : 'Mark as done';
            doneButton.className = 'done-button';
            doneButton.addEventListener('click', function() {
                task.completed = !task.completed;
                task.completedAt = task.completed ? new Date().toISOString() : null;
                saveTasks();
                showTasks(filter);
            });

            // Delete task button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button';
            deleteButton.setAttribute('aria-label', `Delete task ${task.text}`);
            deleteButton.addEventListener('click', function() {
                tasks = tasks.filter(t => t !== task);
                saveTasks();
                showTasks(filter);
            });

            actionContainer.appendChild(doneButton);
            actionContainer.appendChild(deleteButton);

            listItem.appendChild(priorityDot);
            listItem.appendChild(taskDetails);
            listItem.appendChild(actionContainer);

            list.appendChild(listItem);
        });
    });

    if (historyMode) {
        drawPriorityChart();
        drawWeeklyChart();
    }

    updateDashboardStats();
}

/**
 * Groups tasks by year and month.
 */
function groupTasksByMonth(taskList) {
    const groups = new Map();

    taskList.forEach(function(task) {
        const taskDate = task.dueDate ? new Date(`${task.dueDate}T12:00:00`) : null;
        const monthLabel = taskDate
            ? taskDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
            : 'No due date';
        const sortKey = task.dueDate ? task.dueDate.slice(0, 7) : '9999-99';

        if (!groups.has(sortKey)) {
            groups.set(sortKey, { monthLabel: monthLabel, tasks: [] });
        }

        groups.get(sortKey).tasks.push(task);
    });

    return Array.from(groups.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(entry => ({
            monthLabel: entry[1].monthLabel,
            tasks: sortTasks(entry[1].tasks, currentSort)
        }));
}

/**
 * Re-renders tasks when the local calendar day changes while the page is open.
 */
function refreshTasksAfterDateChange() {
    if (getTodayDate() === lastRenderDate) return;
    showTasks(historyMode ? currentFilter : 'active');
}

// Event Listeners
form.addEventListener('submit', function(event) {
    event.preventDefault();
    const taskText = input.value.trim();

    if (taskText === '') return;

    const task = {
        text: taskText,
        dueDate: dateInput.value || getTodayDate(),
        priority: priorityInput.value,
        completed: false,
        completedAt: null
    };

    tasks.push(task);
    saveTasks();
    showTasks(historyMode ? currentFilter : 'active');

    // Tactile button feedback on add
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.classList.add('btn-pressed');
        setTimeout(() => submitBtn.classList.remove('btn-pressed'), 180);
    }

    input.value = '';
    input.focus();
});

filters.addEventListener('click', function(event) {
    if (event.target.tagName !== 'BUTTON') return;
    showTasks(event.target.dataset.filter);
});

statCards.forEach(function(card) {
    card.addEventListener('click', function() {
        showTasks(card.dataset.statFilter);
    });
});

if (searchInput) {
    searchInput.addEventListener('input', function() {
        searchQuery = searchInput.value.trim();
        if (searchClearButton) {
            searchClearButton.hidden = searchInput.value === '';
        }
        showTasks(historyMode ? currentFilter : 'active');
    });
}

if (searchClearButton) {
    searchClearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchQuery = '';
        searchClearButton.hidden = true;
        searchInput.focus();
        showTasks(historyMode ? currentFilter : 'active');
    });
}

if (sortSelect) {
    sortSelect.addEventListener('change', function() {
        currentSort = sortSelect.value;
        showTasks(historyMode ? currentFilter : 'active');
    });
}

historyButton.addEventListener('click', function() {
    historyMode = !historyMode;
    historyButton.textContent = historyMode ? 'Back to tasks' : 'History';
    historyButton.setAttribute('aria-pressed', String(historyMode));
    filters.hidden = !historyMode;
    chartsSection.hidden = !historyMode;
    showTasks(historyMode ? currentFilter : 'active');
});

previousMonthButton.addEventListener('click', function() {
    chartMonth.setMonth(chartMonth.getMonth() - 1);
    drawWeeklyChart();
});

nextMonthButton.addEventListener('click', function() {
    const currentMonth = new Date();
    if (chartMonth.getFullYear() === currentMonth.getFullYear() && chartMonth.getMonth() === currentMonth.getMonth()) return;
    chartMonth.setMonth(chartMonth.getMonth() + 1);
    drawWeeklyChart();
});

// Charting Functions
function drawWeeklyChart() {
    if (weeklyChart) weeklyChart.destroy();

    const year = chartMonth.getFullYear();
    const month = chartMonth.getMonth();
    const monthName = chartMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const currentMonth = new Date();
    nextMonthButton.disabled = year === currentMonth.getFullYear() && month === currentMonth.getMonth();
    const weeks = [0, 0, 0, 0, 0];

    tasks.forEach(task => {
        if (!task.completed || !task.completedAt) return;
        const completedDate = new Date(task.completedAt);
        if (completedDate.getFullYear() === year && completedDate.getMonth() === month) {
            const weekIndex = Math.floor((completedDate.getDate() - 1) / 7);
            if (weekIndex < 5) weeks[weekIndex]++;
        }
    });

    const isLight = document.body.classList.contains('light-mode');
    const barColor = isLight ? '#0071e3' : '#0a84ff';

    weeklyChart = new Chart(weeklyChartCanvas, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            datasets: [{
                label: `Tasks completed - ${monthName}`,
                data: weeks,
                backgroundColor: barColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function drawPriorityChart() {
    if (priorityChart) priorityChart.destroy();

    const high = tasks.filter(task => task.priority === 'high').length;
    const medium = tasks.filter(task => task.priority === 'medium').length;
    const low = tasks.filter(task => task.priority === 'low').length;

    const isLight = document.body.classList.contains('light-mode');
    const colors = isLight
        ? ['#ff3b30', '#ff9500', '#0071e3']
        : ['#ff453a', '#ffd60a', '#0a84ff'];

    priorityChart = new Chart(priorityChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [high, medium, low],
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true
        }
    });
}

window.setInterval(refreshTasksAfterDateChange, 60 * 1000);
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) refreshTasksAfterDateChange();
});

// Initial render
showTasks();
