// ============================================================
// КАЛЕНДАРЬ (МЕСЯЦ И ГОД)
// ============================================================

function renderCalendar() {
    const year = APP.currentYear;
    const month = APP.currentMonth;
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    title.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    let html = '';
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    for (let d of dayNames) {
        html += `<div class="day-name">${d}</div>`;
    }

    const offset = (firstDay === 0) ? 6 : firstDay - 1;

    for (let i = offset - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="day-cell other-month"><span class="day-number">${day}</span></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = dateStr === todayStr;
        const dayData = APP.dayData[dateStr] || { todos: [] };

        const colors = new Set();
        for (let todo of dayData.todos) {
            if (todo.done && todo.challenge) {
                const ch = APP.challenges.find(c => c.name === todo.challenge);
                if (ch && ch.color) colors.add(ch.color);
            }
        }

        let colorDots = '';
        if (colors.size > 0) {
            colorDots = '<div class="day-colors">';
            for (let c of colors) {
                colorDots += `<span class="dot" style="background:${c};"></span>`;
            }
            colorDots += '</div>';
        }

        html += `
            <div class="${isToday ? 'day-cell' : 'day-cell'}" onclick="openDay('${dateStr}')">
                <span class="day-number">${d}</span>
                ${colorDots}
            </div>
        `;
    }

    const totalCells = offset + daysInMonth;
    const remaining = (7 - totalCells % 7) % 7;
    for (let d = 1; d <= remaining; d++) {
        html += `<div class="day-cell other-month"><span class="day-number">${d}</span></div>`;
    }

    grid.innerHTML = html;
    renderChallengeProgress();
}

function renderChallengeProgress() {
    const container = document.getElementById('progressContainer');
    const year = APP.currentYear;
    const month = APP.currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const challengeCounts = {};
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayData = APP.dayData[dateStr] || { todos: [] };
        const doneChallenges = new Set();
        for (let todo of dayData.todos) {
            if (todo.done && todo.challenge) {
                doneChallenges.add(todo.challenge);
            }
        }
        for (let ch of doneChallenges) {
            challengeCounts[ch] = (challengeCounts[ch] || 0) + 1;
        }
    }

    let html = '';
    const totalDays = daysInMonth;
    for (let ch of APP.challenges) {
        const count = challengeCounts[ch.name] || 0;
        const percent = totalDays > 0 ? (count / totalDays * 100) : 0;
        const color = ch.color || '#4a5a6a';
        html += `
            <div class="progress-item">
                <span class="label" style="color:${color};">● ${ch.name}</span>
                <div class="bar-bg">
                    <div class="bar-fill" style="width:${Math.min(percent,100)}%;background:${color};"></div>
                </div>
                <span class="count">${count} дн.</span>
            </div>
        `;
    }

    container.innerHTML = html || '<div class="text-muted">Нет данных за этот месяц</div>';
}

function renderYearCalendar() {
    const container = document.getElementById('yearCalendar');
    const year = APP.currentYear;
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    let html = '';
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const firstDay = new Date(year, m, 1).getDay();
        const offset = (firstDay === 0) ? 6 : firstDay - 1;

        let daysHtml = '';
        for (let i = 0; i < offset; i++) {
            daysHtml += `<div class="day-cell"></div>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            // Проверяем, есть ли челленджи в этот день
            const dayData = APP.dayData[dateStr] || { todos: [] };
            const hasChallenge = dayData.todos.some(t => t.done && t.challenge);
            const isEvent = APP.events && APP.events.some(e => e.date === dateStr);
            let cls = 'day-cell';
            if (hasChallenge) cls += ' has-challenge';
            if (isEvent) cls += ' event-day';
            daysHtml += `<div class="${cls}">${d}</div>`;
        }
        html += `
            <div class="year-month">
                <div class="month-name">${monthNames[m]}</div>
                <div class="month-grid">${daysHtml}</div>
                ${renderMonthChallenges(year, m)}
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderMonthChallenges(year, month) {
    const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;
    const activeChallenges = APP.challenges.filter(ch => {
        if (!ch.startDate) return false;
        if (ch.startDate.slice(0,7) > monthStr) return false;
        if (ch.endDate && ch.endDate.slice(0,7) < monthStr) return false;
        return true;
    });
    if (activeChallenges.length === 0) return '';
    let html = '<div style="margin-top:4px;">';
    for (let ch of activeChallenges) {
        html += `<div class="challenge-bar" style="background:${ch.color || '#2a3344'};"></div>`;
    }
    html += '</div>';
    return html;
}

// Фильтры
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderYearCalendar();
    });
});