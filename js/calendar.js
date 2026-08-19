// ========== ДАННЫЕ ЧЕЛЛЕНДЖЕЙ (хранятся в localStorage) ==========
let challenges = JSON.parse(localStorage.getItem('challenges') || '[]');

// Если челленджей нет — добавим демо-данные для первого запуска
if (challenges.length === 0) {
    challenges = [
        {
            id: 'ch1',
            name: 'Английский каждый день',
            comment: '30 минут чтения + 10 новых слов',
            startDate: { day: 3, month: 0, year: 2026 },
            endDate: { day: 25, month: 0, year: 2026 },
            pace: { unit: 'lessons', customUnit: '', total: 30, perSession: 1, frequency: 'daily' },
            topic: 'linguistics',
            type: 'courses',
            color: '#fde68a'
        },
        {
            id: 'ch2',
            name: 'Утренняя зарядка',
            comment: '15 минут растяжки',
            startDate: { day: 10, month: 0, year: 2026 },
            endDate: { day: 28, month: 0, year: 2026 },
            pace: { unit: 'tasks', customUnit: '', total: 20, perSession: 1, frequency: 'daily' },
            topic: 'other',
            type: 'other',
            color: '#bbf7d0'
        },
        {
            id: 'ch3',
            name: 'Медитация',
            comment: '10 минут осознанности',
            startDate: { day: 1, month: 1, year: 2026 },
            endDate: null,
            pace: { unit: 'custom', customUnit: 'минут', total: 100, perSession: 10, frequency: 'daily' },
            topic: 'philosophy',
            type: 'other',
            color: '#c7d2fe'
        }
    ];
    saveChallenges();
}

function saveChallenges() {
    localStorage.setItem('challenges', JSON.stringify(challenges));
}

// ========== КОНСТАНТЫ ==========
const year = 2026;
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const topicNames = {
    math: 'Математика',
    philosophy: 'Философия',
    linguistics: 'Языкознание',
    other: 'Другое'
};

const typeNames = {
    books: 'Книги',
    courses: 'Курсы',
    other: 'Другое'
};

const unitNames = {
    pages: 'страницы',
    lessons: 'занятия',
    tasks: 'уроки',
    exercises: 'задания',
    custom: 'своё'
};

const frequencyNames = {
    daily: 'ежедневно',
    weekly: 'еженедельно',
    custom: 'своя частота'
};

// ========== УТИЛИТЫ ==========
function daysInMonth(m, y) {
    return new Date(y, m + 1, 0).getDate();
}

function getFirstDayOfMonth(m, y) {
    return new Date(y, m, 1).getDay();
}

function generateId() {
    return 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========== ОТРИСОВКА КАЛЕНДАРЯ ==========
function renderCalendar() {
    const container = document.getElementById('calendar');
    if (!container) return;

    let html = '';

    // Кнопка "Добавить челлендж"
    html += `<div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
        <button class="add-challenge-btn" onclick="openChallengeModal()">+ Добавить челлендж</button>
    </div>`;

    for (let m = 0; m < 12; m++) {
        const totalDays = daysInMonth(m, year);

        html += `<div class="month-row" data-month="${m}">`;
        
        // Левая колонка — название месяца
        html += `<div class="month-label">
            ${monthNames[m]}
            <span class="year">${year}</span>
        </div>`;

        // Правая часть — дни и полоски
        html += `<div class="month-content">`;
        
        // Сетка дней (всегда видна, не перекрывается)
        html += `<div class="days-grid">`;
        for (let d = 1; d <= totalDays; d++) {
            const dateObj = new Date(year, m, d);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const today = new Date();
            const isToday = (today.getFullYear() === year && today.getMonth() === m && today.getDate() === d);
            
            let cls = 'day-cell';
            if (isWeekend) cls += ' weekend';
            if (isToday) cls += ' today';
            
            html += `<div class="${cls}" data-day="${d}" data-month="${m}">${d}</div>`;
        }
        html += `</div>`;

        // Область для полосок челленджей (ПОД сеткой дней)
        html += `<div class="challenge-bars-area" id="challengeBars_${m}"></div>`;
        
        html += `</div>`; // close month-content
        html += `</div>`; // close month-row
    }

    container.innerHTML = html;
    renderChallengeBars();
}

// ========== ОТРИСОВКА ПОЛОСОК ЧЕЛЛЕНДЖЕЙ ==========
function renderChallengeBars() {
    for (let m = 0; m < 12; m++) {
        const barsArea = document.getElementById(`challengeBars_${m}`);
        if (!barsArea) continue;
        barsArea.innerHTML = '';

        // Собираем челленджи, которые пересекаются с этим месяцем
        const monthChallenges = challenges.filter(ch => {
            const sM = ch.startDate.month;
            const eM = ch.endDate ? ch.endDate.month : 11;
            return m >= sM && m <= eM;
        });

        // Рисуем каждую полоску
        monthChallenges.forEach(ch => {
            const sM = ch.startDate.month;
            const eM = ch.endDate ? ch.endDate.month : 11;
            
            let sDay = (m === sM) ? ch.startDate.day : 1;
            let eDay = (m === eM) ? (ch.endDate ? ch.endDate.day : daysInMonth(m, year)) : daysInMonth(m, year);

            const bar = document.createElement('div');
            bar.className = 'challenge-bar';
            bar.style.backgroundColor = ch.color || '#cbd5e1';
            bar.style.width = `${((eDay - sDay + 1) / daysInMonth(m, year)) * 100}%`;
            bar.style.marginLeft = `${((sDay - 1) / daysInMonth(m, year)) * 100}%`;
            
            bar.innerHTML = `<span class="bar-label">${ch.name}</span>`;
            
            // Клик — открыть модалку редактирования
            bar.addEventListener('click', () => openChallengeModal(ch.id));
            
            barsArea.appendChild(bar);
        });
    }
}

// ========== МОДАЛЬНОЕ ОКНО СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ==========
function openChallengeModal(challengeId = null) {
    const modal = document.getElementById('challengeModal');
    if (!modal) return;

    const isEdit = challengeId !== null;
    const ch = isEdit ? challenges.find(c => c.id === challengeId) : null;

    // Заполняем форму
    document.getElementById('challengeModalTitle').textContent = isEdit ? 'Редактировать челлендж' : 'Новый челлендж';
    document.getElementById('chName').value = ch ? ch.name : '';
    document.getElementById('chComment').value = ch ? ch.comment : '';
    
    // Даты
    if (ch) {
        document.getElementById('chStartDate').value = formatDateForInput(ch.startDate);
        if (ch.endDate) {
            document.getElementById('chEndDate').value = formatDateForInput(ch.endDate);
            document.getElementById('chNoEndDate').checked = false;
            document.getElementById('chEndDate').disabled = false;
        } else {
            document.getElementById('chNoEndDate').checked = true;
            document.getElementById('chEndDate').disabled = true;
        }
    } else {
        document.getElementById('chStartDate').value = '';
        document.getElementById('chEndDate').value = '';
        document.getElementById('chNoEndDate').checked = false;
        document.getElementById('chEndDate').disabled = false;
    }

    // Темп
    document.getElementById('chUnit').value = ch ? ch.pace.unit : 'lessons';
    document.getElementById('chCustomUnit').value = ch ? ch.pace.customUnit : '';
    document.getElementById('chCustomUnit').style.display = ch && ch.pace.unit === 'custom' ? 'block' : 'none';
    document.getElementById('chTotal').value = ch ? ch.pace.total : '';
    document.getElementById('chPerSession').value = ch ? ch.pace.perSession : '';
    document.getElementById('chFrequency').value = ch ? ch.pace.frequency : 'daily';

    // Тема и тип
    document.getElementById('chTopic').value = ch ? ch.topic : 'other';
    document.getElementById('chType').value = ch ? ch.type : 'other';

    // Цвет
    document.getElementById('chColor').value = ch ? ch.color : '#fde68a';

    // Кнопка удаления
    document.getElementById('deleteChallengeBtn').style.display = isEdit ? 'block' : 'none';

    // Сохраняем ID для сохранения
    modal.dataset.editingId = challengeId || '';

    modal.classList.add('active');
}

function closeChallengeModal() {
    const modal = document.getElementById('challengeModal');
    if (modal) modal.classList.remove('active');
}

function saveChallenge() {
    const modal = document.getElementById('challengeModal');
    const editingId = modal.dataset.editingId;
    const isEdit = editingId !== '';

    // Собираем данные
    const name = document.getElementById('chName').value.trim();
    if (!name) {
        alert('Введите название челленджа');
        return;
    }

    const startDateStr = document.getElementById('chStartDate').value;
    if (!startDateStr) {
        alert('Выберите дату начала');
        return;
    }

    const startDate = parseDateInput(startDateStr);
    const noEndDate = document.getElementById('chNoEndDate').checked;
    const endDate = noEndDate ? null : parseDateInput(document.getElementById('chEndDate').value);

    if (!noEndDate && !document.getElementById('chEndDate').value) {
        alert('Выберите дату окончания или отметьте "Без даты окончания"');
        return;
    }

    const unit = document.getElementById('chUnit').value;
    const customUnit = unit === 'custom' ? document.getElementById('chCustomUnit').value.trim() : '';

    const challenge = {
        id: isEdit ? editingId : generateId(),
        name: name,
        comment: document.getElementById('chComment').value.trim(),
        startDate: startDate,
        endDate: endDate,
        pace: {
            unit: unit,
            customUnit: customUnit,
            total: parseInt(document.getElementById('chTotal').value) || 0,
            perSession: parseInt(document.getElementById('chPerSession').value) || 0,
            frequency: document.getElementById('chFrequency').value
        },
        topic: document.getElementById('chTopic').value,
        type: document.getElementById('chType').value,
        color: document.getElementById('chColor').value
    };

    if (isEdit) {
        const idx = challenges.findIndex(c => c.id === editingId);
        if (idx !== -1) challenges[idx] = challenge;
    } else {
        challenges.push(challenge);
    }

    saveChallenges();
    closeChallengeModal();
    renderCalendar();
}

function deleteChallenge() {
    const modal = document.getElementById('challengeModal');
    const editingId = modal.dataset.editingId;
    
    if (!editingId) return;
    
    if (!confirm('Удалить этот челлендж?')) return;
    
    challenges = challenges.filter(c => c.id !== editingId);
    saveChallenges();
    closeChallengeModal();
    renderCalendar();
}

// ========== УТИЛИТЫ ДАТ ==========
function formatDateForInput(dateObj) {
    const y = dateObj.year;
    const m = String(dateObj.month + 1).padStart(2, '0');
    const d = String(dateObj.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseDateInput(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { day: d, month: m - 1, year: y };
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    // Чекбокс "Без даты окончания"
    const noEndDateCheckbox = document.getElementById('chNoEndDate');
    if (noEndDateCheckbox) {
        noEndDateCheckbox.addEventListener('change', function() {
            document.getElementById('chEndDate').disabled = this.checked;
        });
    }

    // Выбор единицы измерения
    const unitSelect = document.getElementById('chUnit');
    if (unitSelect) {
        unitSelect.addEventListener('change', function() {
            document.getElementById('chCustomUnit').style.display = this.value === 'custom' ? 'block' : 'none';
        });
    }

    // Кнопки модалки
    const saveBtn = document.getElementById('saveChallengeBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveChallenge);

    const deleteBtn = document.getElementById('deleteChallengeBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', deleteChallenge);

    const cancelBtn = document.getElementById('cancelChallengeBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeChallengeModal);

    // Закрытие по клику на оверлей
    const modal = document.getElementById('challengeModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeChallengeModal();
        });
    }
});