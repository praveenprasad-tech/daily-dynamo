let tasks = [];
let currentFilter = 'all';
let alarmCheckerInterval;

function addTask() {
  const input = document.getElementById('taskInput');
  const deadline = document.getElementById('deadlineInput');
  const text = input.value.trim();

  if (text === '') { alert('Please enter a task!'); return; }
  if (deadline.value === '') { alert('Please set a deadline!'); return; }

  tasks.push({
    id: Date.now(),
    text: text,
    deadline: deadline.value,
    completed: false,
    alarmFired: false
  });

  input.value = '';
  deadline.value = '';
  renderTasks();
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

function filterTasks(filter) {
  currentFilter = filter;
  renderTasks();
}

function playAlarm() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  for (let i = 0; i < 3; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.setValueAtTime(1, ctx.currentTime + i * 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.5 + 0.4);
    oscillator.start(ctx.currentTime + i * 0.5);
    oscillator.stop(ctx.currentTime + i * 0.5 + 0.4);
  }
}

function checkAlarms() {
  const now = new Date();
  tasks.forEach((task, index) => {
    if (task.completed || task.alarmFired) return;
    const deadline = new Date(task.deadline);
    const diff = deadline - now;
    if (diff <= 0) {
      task.alarmFired = true;
      playAlarm();
      showAlert(`⏰ DEADLINE REACHED!\n\n"${task.text}" is INCOMPLETE!\n\nPlease complete your task now!`);
      renderTasks();
    } else if (diff <= 5 * 60 * 1000 && !task.warnedFiveMin) {
      task.warnedFiveMin = true;
      showAlert(`⚠️ REMINDER!\n\n"${task.text}" deadline is in 5 minutes!\n\nHurry up and complete your task!`);
    }
  });
}

function showAlert(message) {
  const overlay = document.getElementById('alertOverlay');
  const msg = document.getElementById('alertMessage');
  msg.innerText = message;
  overlay.style.display = 'flex';
}

function closeAlert() {
  document.getElementById('alertOverlay').style.display = 'none';
}

function getDeadlineStatus(task) {
  if (task.completed) return { label: '✅ Completed', cls: 'completed-status' };
  const now = new Date();
  const deadline = new Date(task.deadline);
  const diff = deadline - now;
  const hours = diff / (1000 * 60 * 60);
  if (diff < 0) return { label: '❌ Incomplete — Deadline passed!', cls: 'overdue' };
  if (hours <= 1) return { label: '🔴 Less than 1 hour left!', cls: 'soon' };
  if (hours <= 24) return { label: '⚠️ Due within 24 hours!', cls: 'soon' };
  return { label: '🟢 On track', cls: 'ok' };
}

function formatDeadline(deadlineStr) {
  const d = new Date(deadlineStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  let filtered = tasks;
  if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
  else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

  if (filtered.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#aaa;margin-top:20px;">No tasks found!</p>';
    return;
  }

  filtered.forEach((task, index) => {
    const status = getDeadlineStatus(task);
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    li.innerHTML = `
      <div class="task-top">
        <span class="task-name">${task.text}</span>
        <div>
          <button class="btn-done" onclick="toggleTask(${index})">
            ${task.completed ? 'Undo' : 'Mark Done'}
          </button>
          <button class="btn-delete" onclick="deleteTask(${index})">Delete</button>
        </div>
      </div>
      <div class="deadline ${status.cls}">
        🕐 Deadline: ${formatDeadline(task.deadline)}
      </div>
      <div class="status-label ${status.cls}">
        ${status.label}
      </div>
    `;
    list.appendChild(li);
  });
}

document.getElementById('taskInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addTask();
});

alarmCheckerInterval = setInterval(checkAlarms, 10000);
setInterval(renderTasks, 30000);