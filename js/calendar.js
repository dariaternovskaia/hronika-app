// ========== ДАННЫЕ ЧЕЛЛЕНДЖЕЙ ==========
let challenges = JSON.parse(localStorage.getItem('hronika_challenges') || '[]');

// Миграция старых данных
let needsSave = false;
challenges = challenges.map(ch => {
    if (!ch.content) {
        ch.content = { amount: 0, unit: 'pages', customUnit: '', note: '' };
        needsSave = true;
    }
    if (!ch.norm) {
        ch.norm = { amount: 0, unit: 'pages' };
        needsSave = true;
    }
    if (!ch.frequency) {
        ch.frequency = { type: 'daily', days: [] };
        needsSave = true;
    }
    return ch;
});
if (needsSave) {
    localStorage.setItem('hronika_challenges', JSON.stringify(challenges));
}

// Если челленджей нет — показываем подсказку
if (challenges.length === 0) {
    console.log('️ Нет челленджей. Нажми "+ Добавить челлендж" чтобы создать первый.');
}

const year = 2026;
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const unitNames = {
    pages: 'страницы',
    lessons: 'занятия',
    tasks: 'уроки',
    exercises: 'задания',
    custom: 'своё'
};

function daysInMonth(m, y) {
    return new Date(y, m + 1, 0).getDate();
}

function generateId() {
    return 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveChallenges() {
    localStorage.setItem('hronika_challenges', JSON.stringify(challenges));
}

function getEffectiveEndDate(ch) {
    if (ch.endDate) return ch.endDate;
    const today = new Date();
    if (today.getFullYear() !== year) {
        return { day: 31, month: 11, year: year };
    }
    return {
        day: today.getDate(),
        month: today.getMonth(),
        year: today.getFullYear()
    };
}

// ========== ОТРИСОВКА КАЛЕНДАРЯ ==========
function renderCalendar() {
    const container = document.getElementById('calendar');
    if (!container) return;

    let html = '';

    html += `<div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
        <button id="addChallengeBtn" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;">+ Добавить челлендж</button>
    </div>`;

    if (challenges.length === 0) {
        html += `<div style="text-align:center;padding:40px;color:#7a8ba8;font-size:16px;">
            📭 Пока нет челленджей. Нажми "+ Добавить челлендж" чтобы создать первый.
        </div>`;
    }

    for (let m = 0; m < 12; m++) {
        const totalDays = daysInMonth(m, year);

        html += `<div class="month-row" data-month="${m}">`;
        html += `<div class="month-label">${monthNames[m]}<span class="year">${year}</span></div>`;
        html += `<div class="days-container">`;

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

            html += `<div class="${cls}">${d}</div>`;
        }
        html += `</div>`;

        html += `<div class="challenge-bars" id="bars-${m}"></div>`;

        html += `</div></div>`;
    }

    container.innerHTML = html;

    const addBtn = document.getElementById('addChallengeBtn');
    if (addBtn) addBtn.addEventListener('click', () => openChallengeModal());

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            renderChallengeBars();
        });
    });
}

// ========== ОТРИСОВКА ПОЛОСОК ==========
function renderChallengeBars() {
    console.log('📊 renderChallengeBars вызвана, челленджей:', challenges.length);
    
    for (let m = 0; m < 12; m++) {
        const container = document.getElementById(`bars-${m}`);
        if (!container) continue;

        container.innerHTML = '';
        const totalDays = daysInMonth(m, year);

        const daysGrid = container.previousElementSibling;
        if (!daysGrid) continue;

        const dayCells = daysGrid.querySelectorAll('.day-cell');
        if (dayCells.length === 0) continue;

        const firstCell = dayCells[0];
        const cellRect = firstCell.getBoundingClientRect();
        const cellWidth = cellRect.width;
        if (cellWidth === 0) {
            console.warn('⚠️ cellWidth = 0, элемент не отрисован');
            continue;
        }

        const gap = 2;
        const cellStep = cellWidth + gap;
        const gridWidth = totalDays * cellWidth + (totalDays - 1) * gap;

        container.style.position = 'relative';
        container.style.width = gridWidth + 'px';
        container.style.height = 'auto';
        container.style.overflow = 'visible';

        const monthChallenges = [];
        challenges.forEach(ch => {
            if (!ch.startDate) return;

            const sM = ch.startDate.month;
            const effEnd = getEffectiveEndDate(ch);
            const eM = effEnd.month;

            if (m < sM || m > eM) return;

            let sDay = (m === sM) ? ch.startDate.day : 1;
            let eDay = (m === eM) ? effEnd.day : totalDays;

            const isClippedRight = ch.endDate === null;
            const isClippedLeft = (m === sM && ch.startDate.day > 1) ? false : (m > sM);

            monthChallenges.push({
                challenge: ch,
                sDay: sDay,
                eDay: eDay,
                isClippedRight: isClippedRight,
                isClippedLeft: isClippedLeft
            });
        });

        console.log(`📅 Месяц ${m}, челленджей для отображения:`, monthChallenges.length);

        const rows = [];
        const barHeight = 26;
        const labelHeight = 16;
        const rowGap = 8;

        monthChallenges.forEach(item => {
            let placed = false;

            for (let r = 0; r < rows.length; r++) {
                let overlap = false;
                for (const existing of rows[r]) {
                    if (item.sDay <= existing.eDay && item.eDay >= existing.sDay) {
                        overlap = true;
                        break;
                    }
                }

                if (!overlap) {
                    rows[r].push(item);
                    placeBar(item, r);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                rows.push([item]);
                placeBar(item, rows.length - 1);
            }
        });

        container.style.height = (rows.length * (barHeight + labelHeight + rowGap)) + 'px';

        function placeBar(item, rowIndex) {
            const ch = item.challenge;

            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.left = ((item.sDay - 1) * cellStep) + 'px';
            label.style.top = (rowIndex * (barHeight + labelHeight + rowGap)) + 'px';
            label.style.fontSize = '10px';
            label.style.color = '#7a8ba8';
            label.style.fontWeight = '500';
            label.style.whiteSpace = 'nowrap';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.maxWidth = ((item.eDay - item.sDay + 1) * cellStep) + 'px';
            label.textContent = ch.name;
            container.appendChild(label);

            const bar = document.createElement('div');
            bar.className = 'challenge-bar';
            bar.style.backgroundColor = ch.color || '#cbd5e1';
            bar.title = ch.comment || ch.name;
            bar.onclick = () => openChallengeModal(ch.id);

            bar.style.position = 'absolute';
            const left = (item.sDay - 1) * cellStep;
            const width = (item.eDay - item.sDay + 1) * cellWidth + (item.eDay - item.sDay) * gap;
            bar.style.left = left + 'px';
            bar.style.top = (rowIndex * (barHeight + labelHeight + rowGap) + labelHeight) + 'px';
            bar.style.width = width + 'px';

            if (item.isClippedRight) {
                bar.style.borderTopRightRadius = '0';
                bar.style.borderBottomRightRadius = '0';
                bar.style.borderRight = '2px dashed rgba(255,255,255,0.3)';
            }
            if (item.isClippedLeft) {
                bar.style.borderTopLeftRadius = '0';
                bar.style.borderBottomLeftRadius = '0';
                bar.style.borderLeft = '2px dashed rgba(255,255,255,0.3)';
            }

            container.appendChild(bar);
            console.log('✅ Полоска создана:', ch.name);
        }
    }
}

// ========== МОДАЛКА ==========
function openChallengeModal(id = null) {
    const isEdit = id !== null;
    const ch = isEdit ? challenges.find(c => c.id === id) : null;

    const title = isEdit ? 'Редактировать челлендж' : 'Новый челлендж';
    const name = ch ? ch.name : '';
    const comment = ch ? ch.comment : '';
    const color = ch ? ch.color : '#fde68a';

    const contentAmount = ch && ch.content ? ch.content.amount : '';
    const contentUnit = ch && ch.content ? ch.content.unit : 'pages';
    const contentCustomUnit = ch && ch.content ? ch.content.customUnit : '';
    const contentNote = ch && ch.content ? ch.content.note : '';

    const normAmount = ch && ch.norm ? ch.norm.amount : '';
    const normUnit = ch && ch.norm ? ch.norm.unit : contentUnit;

    const freqType = ch && ch.frequency ? ch.frequency.type : 'daily';
    const freqDays = ch && ch.frequency ? ch.frequency.days : [];

    const hasEndDate = ch ? (ch.endDate !== null && ch.endDate !== undefined) : false;

    const html = `
        <div class="modal-overlay active" id="challengeModal">
            <div class="modal-card">
                <h2>${title}</h2>

                <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:6px;">Название</label>
                    <input type="text" id="chName" value="${name}" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #1f2838;background:#0b0e14;color:#e8edf5;font-size:14px;font-family:inherit;outline:none;" />
                </div>

                <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:6px;">Комментарий</label>
                    <textarea id="chComment" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #1f2838;background:#0b0e14;color:#e8edf5;font-size:14px;font-family:inherit;outline:none;min-height:60px;resize:vertical;">${comment}</textarea>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                    <div>
                        <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:6px;">Дата начала</label>
                        <input type="date" id="chStart" value="${ch ? formatDateForInput(ch.startDate) : ''}" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #1f2838;background:#0b0e14;color:#e8edf5;font-size:14px;font-family:inherit;" />
                    </div>
                    <div>
                        <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:6px;">Дата окончания</label>
                        <input type="date" id="chEnd" value="${ch && ch.endDate ? formatDateForInput(ch.endDate) : ''}" ${!hasEndDate ? 'disabled' : ''} style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #1f2838;background:#0b0e14;color:#e8edf5;font-size:14px;font-family:inherit;${!hasEndDate ? 'opacity:0.5;' : ''}" />
                        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#7a8ba8;margin-top:6px;cursor:pointer;">
                            <input type="checkbox" id="chNoEnd" ${!hasEndDate ? 'checked' : ''} /> Без даты окончания
                        </label>
                    </div>
                </div>

                <div style="background:#0b0e14;padding:12px;border-radius:10px;border:1px solid #1f2838;margin-bottom:12px;">
                    <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:8px;font-weight:600;">Содержание</label>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:8px;margin-bottom:8px;">
                        <div>
                            <input type="number" id="contentAmount" value="${contentAmount}" placeholder="Число" min="0" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #1f2838;background:#141a24;color:#e8edf5;font-size:13px;font-family:inherit;" />
                        </div>
                        <div>
                            <select id="contentUnit" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #1f2838;background:#141a24;color:#e8edf5;font-size:13px;font-family:inherit;">
                                <option value="pages" ${contentUnit === 'pages' ? 'selected' : ''}>страницы</option>
                                <option value="lessons" ${contentUnit === 'lessons' ? 'selected' : ''}>занятия</option>
                                <option value="tasks" ${contentUnit === 'tasks' ? 'selected' : ''}>уроки</option>
                                <option value="exercises" ${contentUnit === 'exercises' ? 'selected' : ''}>задания</option>
                                <option value="custom" ${contentUnit === 'custom' ? 'selected' : ''}>своё</option>
                            </select>
                        </div>
                    </div>
                    <div id="customUnitContainer" style="display:${contentUnit === 'custom' ? 'block' : 'none'};margin-bottom:8px;">
                        <input type="text" id="contentCustomUnit" value="${contentCustomUnit}" placeholder="Единица измерения" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #1f2838;background:#141a24;color:#e8edf5;font-size:13px;font-family:inherit;" />
                    </div>
                    <div>
                        <input type="text" id="contentNote" value="${contentNote}" placeholder="Ссылки на ресурсы, заметки..." style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #1f2838;background:#141a24;color:#e8edf5;font-size:13px;font-family:inherit;" />
                    </div>
                </div>

                <div style="background:#0b0e14;padding:12px;border-radius:10px;border:1px solid #1f2838;margin-bottom:12px;">
                    <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:8px;font-weight:600;">Норма за один подход</label>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:8px;">
                        <div>
                            <input type="number" id="normAmount" value="${normAmount}" placeholder="Число" min="0" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #1f2838;background:#141a24;color:#e8edf5;font-size:13px;font-family:inherit;" />
                        </div>
                        <div>
                            <select id="normUnit" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #1f2838;background:#141a24;color:#e8edf5;font-size:13px;font-family:inherit;">
                                <option value="pages" ${normUnit === 'pages' ? 'selected' : ''}>страницы</option>
                                <option value="lessons" ${normUnit === 'lessons' ? 'selected' : ''}>занятия</option>
                                <option value="tasks" ${normUnit === 'tasks' ? 'selected' : ''}>уроки</option>
                                <option value="exercises" ${normUnit === 'exercises' ? 'selected' : ''}>задания</option>
                                <option value="custom" ${normUnit === 'custom' ? 'selected' : ''}>своё</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style="background:#0b0e14;padding:12px;border-radius:10px;border:1px solid #1f2838;margin-bottom:12px;">
                    <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:8px;font-weight:600;">Частота подходов</label>
                    <select id="freqType" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #1f2838;background:#141a24;color:#e8edf5;font-size:13px;font-family:inherit;margin-bottom:8px;">
                        <option value="daily" ${freqType === 'daily' ? 'selected' : ''}>Каждый день</option>
                        <option value="everyOtherDay" ${freqType === 'everyOtherDay' ? 'selected' : ''}>Через день</option>
                        <option value="weekly" ${freqType === 'weekly' ? 'selected' : ''}>По дням недели</option>
                    </select>
                    <div id="weekDaysContainer" style="display:${freqType === 'weekly' ? 'block' : 'none'};">
                        <div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${weekDays.map((day, idx) => `
                                <label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:#141a24;border-radius:8px;cursor:pointer;font-size:12px;color:#e8edf5;">
                                    <input type="checkbox" class="weekDayCheckbox" value="${idx}" ${freqDays.includes(idx) ? 'checked' : ''} style="cursor:pointer;" />
                                    ${day}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:13px;color:#7a8ba8;margin-bottom:6px;">Цвет</label>
                    <input type="color" id="chColor" value="${color}" style="width:60px;height:40px;border:1px solid #1f2838;border-radius:8px;background:#0b0e14;cursor:pointer;" />
                </div>

                <div style="display:flex;gap:8px;margin-top:20px;">
                    ${isEdit ? `<button id="deleteChBtn" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;font-family:inherit;margin-right:auto;">Удалить</button>` : ''}
                    <button id="cancelChBtn" style="background:#1a2230;color:#7a8ba8;border:none;border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;font-family:inherit;">Отмена</button>
                    <button id="saveChBtn" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;font-family:inherit;">Сохранить</button>
                </div>
            </div>
        </div>
    `;

    const old = document.getElementById('challengeModal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('challengeModal');
    const noEndCheckbox = document.getElementById('chNoEnd');
    const endDateInput = document.getElementById('chEnd');
    const contentUnitSelect = document.getElementById('contentUnit');
    const customUnitContainer = document.getElementById('customUnitContainer');
    const freqTypeSelect = document.getElementById('freqType');
    const weekDaysContainer = document.getElementById('weekDaysContainer');
    const normUnitSelect = document.getElementById('normUnit');

    noEndCheckbox.addEventListener('change', function() {
        endDateInput.disabled = this.checked;
        endDateInput.style.opacity = this.checked ? '0.5' : '1';
    });

    contentUnitSelect.addEventListener('change', function() {
        customUnitContainer.style.display = this.value === 'custom' ? 'block' : 'none';
        normUnitSelect.value = this.value;
    });

    freqTypeSelect.addEventListener('change', function() {
        weekDaysContainer.style.display = this.value === 'weekly' ? 'block' : 'none';
    });

    document.getElementById('cancelChBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });

    document.getElementById('saveChBtn').addEventListener('click', () => {
        const nameVal = document.getElementById('chName').value.trim();
        if (!nameVal) { alert('Введите название'); return; }

        const startStr = document.getElementById('chStart').value;
        if (!startStr) { alert('Выберите дату начала'); return; }

        const startDate = parseDateInput(startStr);
        const noEnd = document.getElementById('chNoEnd').checked;
        const endDate = noEnd ? null : parseDateInput(document.getElementById('chEnd').value);

        if (!noEnd && !document.getElementById('chEnd').value) {
            alert('Выберите дату окончания или отметьте "Без даты окончания"');
            return;
        }

        const contentUnit = document.getElementById('contentUnit').value;
        const contentCustomUnit = contentUnit === 'custom' ? document.getElementById('contentCustomUnit').value.trim() : '';

        const freqType = document.getElementById('freqType').value;
        const freqDays = freqType === 'weekly'
            ? Array.from(document.querySelectorAll('.weekDayCheckbox:checked')).map(cb => parseInt(cb.value))
            : [];

        const challenge = {
            id: isEdit ? id : generateId(),
            name: nameVal,
            comment: document.getElementById('chComment').value.trim(),
            startDate: startDate,
            endDate: endDate,
            content: {
                amount: parseInt(document.getElementById('contentAmount').value) || 0,
                unit: contentUnit,
                customUnit: contentCustomUnit,
                note: document.getElementById('contentNote').value.trim()
            },
            norm: {
                amount: parseInt(document.getElementById('normAmount').value) || 0,
                unit: document.getElementById('normUnit').value
            },
            frequency: {
                type: freqType,
                days: freqDays
            },
            color: document.getElementById('chColor').value
        };

        if (isEdit) {
            const idx = challenges.findIndex(c => c.id === id);
            if (idx !== -1) challenges[idx] = challenge;
        } else {
            challenges.push(challenge);
        }

        saveChallenges();
        modal.remove();
        renderCalendar();
    });

    if (isEdit) {
        document.getElementById('deleteChBtn').addEventListener('click', () => {
            if (!confirm('Удалить этот челлендж?')) return;
            challenges = challenges.filter(c => c.id !== id);
            saveChallenges();
            modal.remove();
            renderCalendar();
        });
    }
}

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

document.addEventListener('DOMContentLoaded', renderCalendar);