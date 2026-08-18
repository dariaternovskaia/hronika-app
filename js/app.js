// ============================================================
// ГЛАВНЫЙ КОД ПРИЛОЖЕНИЯ
// ============================================================

const STORAGE_KEY = 'hronika_data';
let APP = {
    token: null,
    login: '',
    password: '',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    selectedDate: null,
    dayData: {},
    challenges: [
        { name: 'Латынь (Мирошенкова)', startDate: '2026-08-01', endDate: '', color: '#e74c3c', subject: 'yazyki', type: 'course', tempo: '2', unit: 'уроков' },
        { name: 'История частной жизни. Том 1', startDate: '2026-08-01', endDate: '', color: '#f39c12', subject: '', type: 'book', tempo: '10', unit: 'страниц' },
        { name: 'Кабала (Т. Уайлдер)', startDate: '2026-08-06', endDate: '2026-08-11', color: '#f1c40f', subject: '', type: 'book', tempo: '15', unit: 'страниц' },
        { name: 'Окрестностная семантика', startDate: '2026-08-04', endDate: '2026-08-17', color: '#2ecc71', subject: 'filosofiya', type: 'course', tempo: '1', unit: 'лекций' }
    ],
    events: [],
    challengeColors: {}
};

function loadAppState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(APP, parsed);
            return true;
        }
    } catch (e) {}
    return false;
}

function saveAppState() {
    try {
        const toSave = {
            token: APP.token,
            login: APP.login,
            password: APP.password,
            currentYear: APP.currentYear,
            currentMonth: APP.currentMonth,
            challenges: APP.challenges,
            events: APP.events,
            dayData: APP.dayData
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {}
}

// Инициализация
async function initApp() {
    loadAppState();

    if (APP.token) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        renderCalendar();
        renderChallenges();
        renderGallery();
        showToast('Добро пожаловать!');
        return;
    }

    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';

    document.getElementById('loginBtn').addEventListener('click', async function() {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value.trim();
        const errorEl = document.getElementById('loginError');

        if (!email || !pass) {
            errorEl.textContent = 'Введите email и пароль';
            return;
        }

        try {
            errorEl.textContent = 'Вход...';
            const result = await teraboxLogin(email, pass);
            if (result.success) {
                errorEl.textContent = '';
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('appScreen').style.display = 'block';
                renderCalendar();
                renderChallenges();
                renderGallery();
                showToast('Вход выполнен!');
            }
        } catch (e) {
            errorEl.textContent = e.error || 'Ошибка входа. Проверьте данные.';
        }
    });
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    initApp();

    document.querySelectorAll('.nav button[data-screen]').forEach(btn => {
        btn.addEventListener('click', function() {
            const screen = this.dataset.screen;
            if (screen === 'logout') {
                if (confirm('Выйти из аккаунта?')) {
                    APP.token = null;
                    APP.login = '';
                    APP.password = '';
                    saveAppState();
                    location.reload();
                }
                return;
            }
            showScreen(screen);
        });
    });

    document.getElementById('prevMonth').addEventListener('click', function() {
        APP.currentMonth--;
        if (APP.currentMonth < 0) {
            APP.currentMonth = 11;
            APP.currentYear--;
        }
        renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', function() {
        APP.currentMonth++;
        if (APP.currentMonth > 11) {
            APP.currentMonth = 0;
            APP.currentYear++;
        }
        renderCalendar();
    });

    document.getElementById('prevYear').addEventListener('click', function() {
        APP.currentYear--;
        document.getElementById('yearTitle').textContent = APP.currentYear;
        renderYearCalendar();
    });
    document.getElementById('nextYear').addEventListener('click', function() {
        APP.currentYear++;
        document.getElementById('yearTitle').textContent = APP.currentYear;
        renderYearCalendar();
    });

    document.getElementById('dayBackBtn').addEventListener('click', function() {
        saveCurrentDay();
        showScreen('calendar');
    });
    document.getElementById('daySaveBtn').addEventListener('click', saveCurrentDay);
    document.getElementById('addTodoBtn').addEventListener('click', addTodo);
    document.getElementById('addEventBtn').addEventListener('click', addEvent);
    document.getElementById('addChallengeBtn').addEventListener('click', addChallenge);
    document.getElementById('uploadDayFileBtn').addEventListener('click', uploadDayFile);
    document.getElementById('uploadDayPhotoBtn').addEventListener('click', uploadDayPhoto);

    document.getElementById('dayNotes').addEventListener('blur', function() {
        const data = getCurrentDayData();
        if (data) {
            data.notes = this.value;
            saveAppState();
        }
    });
});

// Функции для открытия дня
async function openDay(dateStr) {
    APP.selectedDate = dateStr;
    const parts = dateStr.split('-');
    const day = parseInt(parts[2]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[0]);
    const monthNames = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
        'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
    document.getElementById('dayTitle').textContent = `${day} ${monthNames[month-1]} ${year}`;

    let dayData = APP.dayData[dateStr];
    if (!dayData) {
        dayData = await loadDayData(dateStr);
        APP.dayData[dateStr] = dayData;
        saveAppState();
    }

    renderDayPage(dayData);
    generateRecommendations();
    showScreen('day');
}

function renderDayPage(data) {
    const todoList = document.getElementById('todoList');
    const notes = document.getElementById('dayNotes');
    const dayFiles = document.getElementById('dayFilesList');

    notes.value = data.notes || '';

    let html = '';
    for (let i = 0; i < data.todos.length; i++) {
        const todo = data.todos[i];
        const doneClass = todo.done ? 'done' : '';
        const textClass = todo.done ? 'done-text' : '';
        const color = todo.color || '#2a3344';

        html += `
            <div class="todo-item" style="border-left-color:${color};">
                <div class="todo-check ${doneClass}" onclick="toggleTodo(${i})"></div>
                <span class="todo-text ${textClass}">${escHtml(todo.text)}</span>
                <button class="todo-delete" onclick="deleteTodo(${i})">✕</button>
                <div class="todo-files">
                    ${(todo.files || []).map(f => `
                        <span class="file-tag">
                            ${f}
                            <span class="remove-file" onclick="removeTodoFile(${i}, '${f}')">✕</span>
                        </span>
                    `).join('')}
                    <button class="todo-upload-btn" onclick="uploadTodoFile(${i})">+ файл</button>
                </div>
            </div>
        `;
    }
    todoList.innerHTML = html || '<div class="text-muted" style="padding:12px;text-align:center;">Нет дел на сегодня</div>';

    let filesHtml = '';
    for (let f of (data.dayFiles || [])) {
        filesHtml += `
            <span class="file-tag">
                ${f}
                <span class="remove-file" onclick="removeDayFile('${f}')">✕</span>
            </span>
        `;
    }
    dayFiles.innerHTML = filesHtml || '<span class="text-muted">Нет файлов</span>';
}