// ============================================================
// КАЛЕНДАРЬ (БЕСКОНЕЧНЫЙ СКРОЛЛ)
// ============================================================

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function renderCalendar() {
    const wrapper = document.getElementById('calendarWrapper');
    let html = '<div class="calendar-scroll" id="calendarScroll">';
    
    // Показываем 24 месяца: 12 назад и 12 вперёд от текущего
    const startYear = currentYear - 1;
    const startMonth = currentMonth;
    
    for (let i = 0; i < 24; i++) {
        const year = startYear + Math.floor((startMonth + i) / 12);
        const month = (startMonth + i) % 12;
        html += renderMonth(year, month);
    }
    
    html += '</div>';
    wrapper.innerHTML = html;
    
    // Скролл к текущему месяцу
    setTimeout(() => {
        const scroll = document.getElementById('calendarScroll');
        if (scroll) {
            const currentMonthEl = scroll.querySelector(`[data-year="${new Date().getFullYear()}"][data-month="${new Date().getMonth()}"]`);
            if (currentMonthEl) {
                currentMonthEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, 100);
}

function renderMonth(year, month) {
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const offset = (firstDay === 0) ? 6 : firstDay - 1;
    
    let gridHtml = '';
    for (let i = offset - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        gridHtml += `<div class="day-cell other-month"><span class="day-number">${day}</span></div>`;
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const hasChallenge = APP.challenges.some(ch => 
            ch.startDate <= dateStr && (!ch.endDate || ch.endDate >= dateStr)
        );
        const isEvent = APP.events.some(e => e.date === dateStr);
        
        let cls = 'day-cell';
        if (hasChallenge) cls += ' has-challenge';
        if (isEvent) cls += ' event-day';
        
        let dots = '';
        if (hasChallenge) {
            const colors = APP.challenges
                .filter(ch => ch.startDate <= dateStr && (!ch.endDate || ch.endDate >= dateStr))
                .map(ch => ch.color);
            dots = colors.map(c => `<span class="challenge-dot" style="background:${c};"></span>`).join('');
        }
        if (isEvent) {
            dots += '<span class="event-dot"></span>';
        }
        
        gridHtml += `
            <div class="${cls}" onclick="openDayModal('${dateStr}')">
                <span class="day-number">${d}</span>
                ${dots ? `<div style="display:flex;gap:1px;margin-top:1px;">${dots}</div>` : ''}
            </div>
        `;
    }
    
    // Полоски челленджей за месяц
    let barsHtml = '';
    const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;
    const monthChallenges = APP.challenges.filter(ch => 
        ch.startDate.slice(0,7) <= monthStr && (!ch.endDate || ch.endDate.slice(0,7) >= monthStr)
    );
    for (let ch of monthChallenges) {
        const startDay = parseInt(ch.startDate.split('-')[2]) || 1;
        const endDay = ch.endDate ? parseInt(ch.endDate.split('-')[2]) : daysInMonth;
        barsHtml += `<div class="bar" style="background:${ch.color};width:${((endDay - startDay + 1) / daysInMonth * 100)}%;margin-left:${((startDay - 1) / daysInMonth * 100)}%;"></div>`;
    }
    
    return `
        <div class="calendar-month" data-year="${year}" data-month="${month}">
            <div class="month-title">${monthNames[month]} ${year}</div>
            <div class="month-grid">${gridHtml}</div>
            ${barsHtml ? `<div class="challenge-bars">${barsHtml}</div>` : ''}
        </div>
    `;
}

function openDayModal(dateStr) {
    const modal = document.getElementById('dayModal');
    const title = document.getElementById('dayModalTitle');
    const content = document.getElementById('dayModalContent');
    
    const parts = dateStr.split('-');
    const day = parseInt(parts[2]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[0]);
    const monthNames = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
        'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
    title.textContent = `${day} ${monthNames[month-1]} ${year}`;
    
    // Находим челленджи, активные в этот день
    const activeChallenges = APP.challenges.filter(ch => 
        ch.startDate <= dateStr && (!ch.endDate || ch.endDate >= dateStr)
    );
    
    let html = `
        <div style="margin-bottom:16px;">
            <h4 style="color:#7a8ba8;margin-bottom:8px;">Челленджи</h4>
            ${activeChallenges.length > 0 ? 
                activeChallenges.map(ch => 
                    `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
                        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${ch.color};"></span>
                        <span>${ch.name}</span>
                        <span style="font-size:12px;color:#5a6a7a;">${ch.startDate} — ${ch.endDate || 'бесконечно'}</span>
                    </div>`
                ).join('') : 
                '<div class="text-muted">Нет активных челленджей</div>'
            }
        </div>
        <div style="margin-bottom:16px;">
            <h4 style="color:#7a8ba8;margin-bottom:8px;">События</h4>
            ${APP.events.filter(e => e.date === dateStr).map(e => 
                `<div style="padding:4px 0;">${e.text}</div>`
            ).join('') || '<div class="text-muted">Нет событий</div>'}
        </div>
        <hr style="border-color:#1a2230;margin:12px 0;">
        <h4 style="color:#7a8ba8;margin-bottom:8px;">Добавить челлендж</h4>
        <label>Название</label>
        <input type="text" id="newChallengeName" placeholder="Полное название челленджа">
        <label>Дата начала</label>
        <input type="date" id="newChallengeStart" value="${dateStr}">
        <label>Дата окончания (оставьте пустым, если бесконечно)</label>
        <input type="date" id="newChallengeEnd">
        <label>Цвет</label>
        <input type="color" id="newChallengeColor" value="#e74c3c">
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeDayModal()">Закрыть</button>
            <button class="btn-primary" onclick="addChallengeFromDay()">Добавить челлендж</button>
        </div>
    `;
    
    content.innerHTML = html;
    modal.classList.add('open');
}

function closeDayModal() {
    document.getElementById('dayModal').classList.remove('open');
}

function addChallengeFromDay() {
    const name = document.getElementById('newChallengeName').value.trim();
    if (!name) return showToast('Введите название', 'error');
    const startDate = document.getElementById('newChallengeStart').value;
    const endDate = document.getElementById('newChallengeEnd').value || '';
    const color = document.getElementById('newChallengeColor').value;
    
    APP.challenges.push({ name, startDate, endDate, color });
    saveAppState();
    closeDayModal();
    renderCalendar();
    showToast('Челлендж добавлен');
}