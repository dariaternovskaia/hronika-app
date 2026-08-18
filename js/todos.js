// ============================================================
// СПИСОК ДЕЛ, РЕКОМЕНДАЦИИ, СОБЫТИЯ
// ============================================================

function getCurrentDayData() {
    const dateStr = APP.selectedDate;
    if (!dateStr) return null;
    if (!APP.dayData[dateStr]) {
        APP.dayData[dateStr] = { date: dateStr, todos: [], notes: '', dayFiles: [], todoFiles: {}, events: [] };
    }
    return APP.dayData[dateStr];
}

function generateRecommendations() {
    const container = document.getElementById('recommendations');
    const dateStr = APP.selectedDate;
    if (!dateStr) return;

    // Находим активные челленджи на эту дату
    const activeChallenges = APP.challenges.filter(ch => {
        if (!ch.startDate) return false;
        if (ch.endDate && ch.endDate < dateStr) return false;
        if (ch.startDate > dateStr) return false;
        return true;
    });

    if (activeChallenges.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Считаем, сколько уже сделано за месяц
    const monthStart = dateStr.slice(0, 7);
    let doneCounts = {};
    for (let date in APP.dayData) {
        if (date.startsWith(monthStart)) {
            for (let todo of APP.dayData[date].todos || []) {
                if (todo.done && todo.challenge) {
                    doneCounts[todo.challenge] = (doneCounts[todo.challenge] || 0) + 1;
                }
            }
        }
    }

    let html = '<h4>Рекомендации</h4>';
    for (let ch of activeChallenges) {
        const done = doneCounts[ch.name] || 0;
        const tempo = parseInt(ch.tempo) || 1;
        const unit = ch.unit || 'уроков';
        const dayOfMonth = parseInt(dateStr.split('-')[2]);
        const expected = Math.ceil(dayOfMonth / 30 * tempo * 30 / 30) || 1;
        if (done < expected) {
            html += `
                <div class="rec-item">
                    <span>${escHtml(ch.name)}: сделать ${tempo} ${unit}</span>
                    <button onclick="addRecommendedTodo('${escHtml(ch.name)}', ${tempo}, '${unit}', '${ch.color}')">+ Добавить</button>
                </div>
            `;
        }
    }
    container.innerHTML = html;
}

function addRecommendedTodo(challengeName, tempo, unit, color) {
    const data = getCurrentDayData();
    if (!data) return;
    data.todos.push({
        text: `${challengeName}: ${tempo} ${unit}`,
        done: false,
        color: color || '#2a3344',
        challenge: challengeName,
        files: []
    });
    saveCurrentDay();
    renderDayPage(data);
    showToast('Дело добавлено');
}

function addTodo() {
    showModal('Добавить дело', `
        <label>Текст дела</label>
        <input type="text" id="newTodoText" placeholder="Что нужно сделать?" autofocus>
        <label>Челлендж (цвет подхватится автоматически)</label>
        <select id="newTodoChallenge">
            <option value="">—</option>
            ${APP.challenges.map(ch => `<option value="${ch.name}" data-color="${ch.color || '#2a3344'}">${ch.name}</option>`).join('')}
        </select>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddTodo()">Добавить</button>
        </div>
    `);
}

function confirmAddTodo() {
    const text = document.getElementById('newTodoText').value.trim();
    if (!text) return showToast('Введите текст', 'error');
    const challengeName = document.getElementById('newTodoChallenge').value;
    const challenge = APP.challenges.find(c => c.name === challengeName);
    const color = challenge ? challenge.color : '#2a3344';
    const data = getCurrentDayData();
    if (!data) return;
    data.todos.push({
        text: text,
        done: false,
        color: color,
        challenge: challengeName || null,
        files: []
    });
    saveCurrentDay();
    renderDayPage(data);
    closeModal();
    showToast('Дело добавлено');
}

function addEvent() {
    showModal('Добавить событие', `
        <label>Название события</label>
        <input type="text" id="eventText" placeholder="Название события" autofocus>
        <label>Дата события</label>
        <input type="date" id="eventDate" value="${APP.selectedDate || new Date().toISOString().slice(0,10)}">
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddEvent()">Добавить</button>
        </div>
    `);
}

function confirmAddEvent() {
    const text = document.getElementById('eventText').value.trim();
    if (!text) return showToast('Введите название', 'error');
    const date = document.getElementById('eventDate').value;
    if (!date) return showToast('Выберите дату', 'error');
    // Сохраняем событие
    if (!APP.events) APP.events = [];
    APP.events.push({ text: text, date: date });
    saveAppState();
    closeModal();
    showToast('Событие добавлено');
}

function toggleTodo(index) {
    const data = getCurrentDayData();
    if (!data) return;
    data.todos[index].done = !data.todos[index].done;
    saveCurrentDay();
    renderDayPage(data);
}

function deleteTodo(index) {
    if (!confirm('Удалить дело?')) return;
    const data = getCurrentDayData();
    if (!data) return;
    data.todos.splice(index, 1);
    saveCurrentDay();
    renderDayPage(data);
    showToast('Дело удалено');
}

async function saveCurrentDay() {
    const dateStr = APP.selectedDate;
    if (!dateStr) return;
    const data = getCurrentDayData();
    if (!data) return;
    data.notes = document.getElementById('dayNotes').value;
    await saveDayData(dateStr, data);
    renderCalendar();
    showToast('День сохранён');
}