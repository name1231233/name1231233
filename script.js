document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('taskList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const filterStatus = document.getElementById('filterStatus');
    const sortTasks = document.getElementById('sortTasks');
    const notificationModal = document.getElementById('notificationModal');
    const notificationMessage = document.getElementById('notificationMessage');
    const closeNotification = document.getElementById('closeNotification');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let editingTaskId = null;

    function renderTasks() {
        taskList.innerHTML = '';
        let filteredTasks = tasks.filter(task => 
            filterStatus.value === 'all' || task.status === filterStatus.value
        );

        if (sortTasks.value === 'title') {
            filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            filteredTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

        filteredTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card');
            taskCard.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description || ''}</p>
                <p class="deadline">Дедлайн: ${task.deadline}</p>
                <div class="tags">Теги: ${task.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
                <div class="status">${task.status === 'pending' ? 'В процессе' : 'Завершено'}</div>
                <button onclick="editTask('${task.id}')">Редактировать</button>
                <button onclick="deleteTask('${task.id}')">Удалить</button>
            `;
            taskList.appendChild(taskCard);
        });
    }

    function showNotification(message, type) {
        notificationMessage.textContent = message;
        notificationModal.style.display = 'block';
        notificationModal.classList.remove('error', 'success');
        notificationModal.classList.add(type);
    }

    closeNotification.addEventListener('click', () => {
        notificationModal.style.display = 'none';
    });

    function isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        return regex.test(dateString) && !isNaN(new Date(dateString).getTime());
    }

    addTaskBtn.addEventListener('click', () => {
        editingTaskId = null;
        document.getElementById('modalTitle').textContent = 'Добавить задачу';
        taskForm.reset();
        taskModal.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const deadline = document.getElementById('taskDeadline').value;
        const tags = document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const status = document.getElementById('taskStatus').value;

        if (!title) {
            showNotification('Название задачи не может быть пустым', 'error');
            return;
        }
        if (!isValidDate(deadline)) {
            showNotification('Дедлайн должен быть в формате YYYY-MM-DD', 'error');
            return;
        }
        if (tags.length === 0) {
            showNotification('Теги не могут быть пустыми', 'error');
            return;
        }
        const uniqueTags = new Set(tags);
        if (uniqueTags.size !== tags.length) {
            showNotification('Теги не должны дублироваться', 'error');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const task = {
            id: editingTaskId || Date.now().toString(),
            title,
            description,
            deadline,
            tags: Array.from(uniqueTags),
            status,
            createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : timestamp,
            updatedAt: timestamp,
            history: editingTaskId 
                ? [...tasks.find(t => t.id === editingTaskId).history, { action: 'updated', timestamp }]
                : [{ action: 'created', timestamp }]
        };

        if (editingTaskId) {
            tasks = tasks.map(t => t.id === editingTaskId ? task : t);
        } else {
            tasks.push(task);
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskModal.style.display = 'none';
        showNotification('Задача успешно сохранена', 'success');
        renderTasks();
    });

    window.editTask = (id) => {
        const task = tasks.find(t => t.id === id);
        editingTaskId = id;
        document.getElementById('modalTitle').textContent = 'Редактировать задачу';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskDeadline').value = task.deadline;
        document.getElementById('taskTags').value = task.tags.join(', ');
        document.getElementById('taskStatus').value = task.status;
        taskModal.style.display = 'block';
    };

    window.deleteTask = (id) => {
        if (confirm('Вы уверены, что хотите удалить задачу?')) {
            tasks = tasks.filter(t => t.id !== id);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            showNotification('Задача удалена', 'success');
            renderTasks();
        }
    };

    filterStatus.addEventListener('change', renderTasks);
    sortTasks.addEventListener('change', renderTasks);

    renderTasks();
});