// ========== ДАННЫЕ ЧЕЛЛЕНДЖЕЙ ==========
let challenges = JSON.parse(localStorage.getItem('hronika_challenges') || '[]');

if (challenges.length === 0) {
    challenges = [
        {
            id: 'ch1',
            name: 'Английский каждый день',
            comment: '30 минут чтения + 10 новых слов',
            startDate: { day: 3, month: 0, year: 2026 },
            endDate: { day: 27, month: 5, year: 2026 },
            color: '#fde68a'
        },
        {
            id: 'ch2',
            name: 'Утренняя зарядка',
            comment: '15 минут растяжки',
            startDate: { day: 10, month: 0, year: 2026 },
            endDate: { day: 28, month: 0, year: 2026 },
            color: '#bbf7d0'
        },
        {
            id: 'ch3',
            name: 'Медитация',
            comment: '10 минут осознанности',
            startDate: { day: 1, month: 1, year: 2026 },
            endDate: { day: 20, month: 1, year: 2026 },
            color: '#c7d2fe'
        },
        {
            id: 'ch4',
            name: 'Чтение книг',
            comment: '30 страниц в день',
            startDate: { day: 5, month: 1, year: 2026 },
            endDate: { day: 26, month: 1, year: 2026 },
            color: '#fecaca'
        },
        {
            id: 'ch5',
            name: 'Прогулка 10k шагов',
            comment: 'Ежедневная прогулка',
            startDate: { day: 8, month: 2, year: 2026 },
            endDate: { day: 30, month: 2, year: 2026 },
            color: '#fed7aa'
        },
        {
            id: 'ch6',
            name: 'Испанский с нуля',
            comment: 'Duolingo + произношение',
            startDate: { day: 1, month: 3, year: 2026 },
            endDate: { day: 18, month: 3, year: 2026 },
            color: '#bae6fd'
        }
    ];
    localStorage.setItem('hronika_challenges', JSON.stringify(challenges));
}

const year = 2026;
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function daysInMonth(m, y) {
    return new Date(y, m + 1, 0).getDate();
}

function generateId() {
    return 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveChallenges() {
    localStorage.setItem('hronika_challenges', JSON.stringify(challenges));
}

// ========== ОТРИСОВКА КАЛЕНДАРЯ ==========
function renderCalendar() {
    const container = document.getElementById('calendar');
    if (!container) return;

    let html = '';

    // Кнопка добавления
    html += `<div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
        <button id="addChallengeBtn" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;">+ Добавить челлендж</button>
    </div>`;

    for (let m = 0; m < 12; m++) {
        const totalDays = daysInMonth(m, year);

        html += `<div class="month-row" data-month="${m}">`;
        html += `<div class="month-label">${monthNames[m]}<span class="year">${year}</span></div>`;
        html += `<div class="days-container">`;

        // Сетка дней
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

        // Полоски челленджей (ПОД днями)
        html += `<div class="challenge-bars" id="bars-${m}"></div>`;

        html += `</div></div>`;
    }

    container.innerHTML = html;

    // Кнопка добавления
    const addBtn = document.getElementById('addChallengeBtn');
    if (addBtn) addBtn.addEventListener('click', () => openChallengeModal());

    renderChallengeBars();
}

// ========== ОТРИСОВКА ПОЛОСОК (без наложений) ==========
function renderChallengeBars() {
    for (let m = 0; m < 12; m++) {
        const container = document.getElementById(`bars-${m}`);
        if (!container) continue;

        container.innerHTML = '';
        const totalDays = daysInMonth(m, year);

        // Получаем сетку дней для расчёта реальных размеров
        const daysGrid = container.previousElementSibling;
        if (!daysGrid) continue;

        const dayCells = daysGrid.querySelectorAll('.day-cell');
        if (dayCells.length === 0) continue;

        // Измеряем реальную ширину одной ячейки и gap
        const firstCell = dayCells[0];
        const cellRect = firstCell.getBoundingClientRect();
        const cellWidth = cellRect.width;
        const gap = 2;
        const cellStep = cellWidth + gap;
        const gridWidth = totalDays * cellWidth + (totalDays - 1) * gap;

        // Устанавливаем контейнеру ту же ширину, что у сетки
        container.style.position = 'relative';
        container.style.width = gridWidth + 'px';
        container.style.height = 'auto';
        container.style.overflow = 'visible';

        // Собираем челленджи для этого месяца
        const monthChallenges = [];
        challenges.forEach(ch => {
            const sM = ch.startDate.month;
            const eM = ch.endDate ? ch.endDate.month : 11;

            if (m < sM || m > eM) return;

            let sDay = (m === sM) ? ch.startDate.day : 1;
            let eDay = (m === eM) ? (ch.endDate ? ch.endDate.day : totalDays) : totalDays;

            monthChallenges.push({
                challenge: ch,
                sDay: sDay,
                eDay: eDay,
                isClippedRight: (m === eM && ch.endDate) ? false : (m < eM),
                isClippedLeft: (m === sM && ch.startDate.day > 1) ? false : (m > sM)
            });
        });

        // Алгоритм размещения без наложений (вертикальный стек)
        const rows = []; // каждая строка — массив {sDay, eDay, bar}
        const barHeight = 26;
        const rowGap = 4;

        monthChallenges.forEach(item => {
            let placed = false;
            
            // Пытаемся найти свободную строку
            for (let r = 0; r < rows.length; r++) {
                let overlap = false;
                for (const existing of rows[r]) {
                    // Проверяем пересечение
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
            
            // Если не нашли свободную строку — создаём новую
            if (!placed) {
                rows.push([item]);
                placeBar(item, rows.length - 1);
            }
        });

        // Устанавливаем высоту контейнера
        container.style.height = (rows.length * (barHeight + rowGap)) + 'px';

        function placeBar(item, rowIndex) {
            const ch = item.challenge;
            const bar = document.createElement('div');
            bar.className = 'challenge-bar';
            bar.style.backgroundColor = ch.color || '#cbd5e1';
            bar.textContent = ch.name;
            bar.title = ch.comment || ch.name;
            bar.onclick = () => openChallengeModal(ch.id);

            // Абсолютное позиционирование в пикселях
            bar.style.position = 'absolute';
            const left = (item.sDay - 1) * cellStep;
            const width = (item.eDay - item.sDay + 1) * cellWidth + (item.eDay - item.sDay) * gap;
            bar.style.left = left + 'px';
            bar.style.top = (rowIndex * (barHeight + rowGap)) + 'px';
            bar.style.width = width + 'px';

            // "Рубленый" конец
            if (item.isClippedRight) {
                bar.style.borderTopRightRadius = '0';
                bar.style.borderBottomRightRadius = '0';
                bar.style.borderRight = '2px dashed rgba(0,0,0,0.3)';
            }
            if (item.isClippedLeft) {
                bar.style.borderTopLeftRadius = '0';
                bar.style.borderBottomLeftRadius = '0';
                bar.style.borderLeft = '2px dashed rgba(0,0,0,0.3)';
            }

            container.appendChild(bar);
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
                        <input type="date" id="chEnd" value="${ch && ch.endDate ? formatDateForInput(ch.endDate) : ''}" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid #1f2838;background:#0b0e14;color:#e8edf5;font-size:14px;font-family:inherit;" />
                        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#7a8ba8;margin-top:6px;cursor:pointer;">
                            <input type="checkbox" id="chNoEnd" ${!ch || !ch.endDate ? 'checked' : ''} /> Без даты окончания
                        </label>
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

    // Удаляем старую модалку если есть
    const old = document.getElementById('challengeModal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('challengeModal');
    const noEndCheckbox = document.getElementById('chNoEnd');
    const endDateInput = document.getElementById('chEnd');

    noEndCheckbox.addEventListener('change', function() {
        endDateInput.disabled = this.checked;
    });
    endDateInput.disabled = noEndCheckbox.checked;

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

        const challenge = {
            id: isEdit ? id : generateId(),
            name: nameVal,
            comment: document.getElementById('chComment').value.trim(),
            startDate: startDate,
            endDate: endDate,
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

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', renderCalendar);