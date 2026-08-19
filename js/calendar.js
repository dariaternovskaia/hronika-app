// ============================================================
// КАЛЕНДАРЬ (ПОЛОСЫ ПОВЕРХ ДНЕЙ)
// ============================================================

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function renderCalendar() {
    const wrapper = document.getElementById('calendarWrapper');
    let html = '<div class="calendar-scroll" id="calendarScroll">';
    
    const startYear = currentYear - 1;
    const startMonth = currentMonth;
    
    for (let i = 0; i < 24; i++) {
        const year = startYear + Math.floor((startMonth + i) / 12);
        const month = (startMonth + i) % 12;
        html += renderMonth(year, month);
    }
    
    html += '</div>';
    wrapper.innerHTML = html;
    
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
    const offset = (firstDay === 0) ? 6 : firstDay - 1;
    
    // ===== СТРОИМ СЕТКУ ДНЕЙ =====
    let gridHtml = '';
    
    // Пустые ячейки до первого дня
    for (let i = offset - 1; i >= 0; i--) {
        const day = new Date(year, month, 0).getDate() - i;
        gridHtml += `<div class="day-cell other-month"><span class="day-number">${day}</span></div>`;
    }
    
    // Дни месяца
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayChallenges = APP.challenges.filter(ch => 
            ch.startDate <= dateStr && (!ch.endDate || ch.endDate >= dateStr)
        );
        const isEvent = APP.events && APP.events.some(e => e.date === dateStr);
        
        const hasChallenge = dayChallenges.length > 0;
        let cls = 'day-cell';
        if (hasChallenge) cls += ' has-challenge';
        if (isEvent) cls += ' event-day';
        
        // Точки под числом (показывают, какие челленджи активны)
        let dots = '';
        if (dayChallenges.length > 0) {
            const colors = dayChallenges.map(ch => ch.color);
            dots = colors.map(c => `<span class="challenge-dot" style="background:${c};"></span>`).join('');
        }
        if (isEvent) {
            dots += '<span class="event-dot"></span>';
        }
        
        gridHtml += `
            <div class="${cls}" onclick="openDayModal('${dateStr}')" style="position:relative;z-index:2;">
                <span class="day-number">${d}</span>
                ${dots ? `<div style="display:flex;gap:1px;margin-top:1px;flex-wrap:wrap;justify-content:center;">${dots}</div>` : ''}
            </div>
        `;
    }
    
    // ============================================================
    // ПОЛОСЫ — ПОВЕРХ ДНЕЙ (КАК НАЛОЖЕНИЕ)
    // ============================================================
    const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;
    const monthChallenges = APP.challenges.filter(ch => {
        const chStart = ch.startDate || '1970-01-01';
        const chEnd = ch.endDate || '2999-12-31';
        const monthStart = `${year}-${String(month+1).padStart(2,'0')}-01`;
        const monthEnd = `${year}-${String(month+1).padStart(2,'0')}-${daysInMonth}`;
        return chStart <= monthEnd && chEnd >= monthStart;
    });
    
    // Уникальные челленджи по имени
    const uniqueChallenges = [];
    const seen = new Set();
    for (let ch of monthChallenges) {
        const key = ch.name + ch.color;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueChallenges.push(ch);
        }
    }
    
    // Строим полосы поверх дней
    let overlayHtml = '';
    for (let ch of uniqueChallenges) {
        let startDay = 1;
        let endDay = daysInMonth;
        
        // Определяем реальные даты начала и окончания в этом месяце
        if (ch.startDate && ch.startDate.slice(0,7) === monthStr) {
            startDay = parseInt(ch.startDate.split('-')[2]) || 1;
        }
        if (ch.endDate && ch.endDate.slice(0,7) === monthStr) {
            endDay = parseInt(ch.endDate.split('-')[2]) || daysInMonth;
        }
        if (ch.startDate && ch.startDate < monthStr + '-01' && (!ch.endDate || ch.endDate > monthStr + '-' + daysInMonth)) {
            startDay = 1;
            endDay = daysInMonth;
        }
        
        // Вычисляем позицию полосы в сетке
        const startOffset = offset + startDay - 1;
        const endOffset = offset + endDay - 1;
        const totalCells = offset + daysInMonth;
        const cols = 7;
        
        const startRow = Math.floor(startOffset / cols);
        const endRow = Math.floor(endOffset / cols);
        const startCol = startOffset % cols;
        const endCol = endOffset % cols;
        
        // Полоса может занимать несколько строк
        for (let row = startRow; row <= endRow; row++) {
            const rowStartCol = (row === startRow) ? startCol : 0;
            const rowEndCol = (row === endRow) ? endCol : cols - 1;
            const left = (rowStartCol / cols * 100);
            const width = ((rowEndCol - rowStartCol + 1) / cols * 100);
            const top = (row / (Math.ceil(totalCells / cols)) * 100);
            const height = (1 / (Math.ceil(totalCells / cols)) * 100);
            
            overlayHtml += `
                <div class="challenge-bar-overlay" style="
                    position: absolute;
                    top: ${top}%;
                    left: ${left}%;
                    width: ${width}%;
                    height: ${height}%;
                    background: ${ch.color};
                    opacity: 0.3;
                    border-radius: 2px;
                    pointer-events: none;
                    z-index: 1;
                "></div>
            `;
        }
    }
    
    // ===== ЛЕГЕНДА ПОД МЕСЯЦЕМ =====
    let legendHtml = '';
    if (uniqueChallenges.length > 0) {
        legendHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;padding:4px 0;border-top:1px solid #1a2230;">';
        for (let ch of uniqueChallenges) {
            const challengeIndex = APP.challenges.indexOf(ch);
            legendHtml += `
                <span style="display:flex;align-items:center;gap:4px;font-size:10px;color:#7a8ba8;cursor:pointer;" onclick="openChallengeModal(${challengeIndex})">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${ch.color};"></span>
                    ${ch.name.length > 20 ? ch.name.slice(0,20) + '…' : ch.name}
                </span>
            `;
        }
        legendHtml += '</div>';
    }
    
    return `
        <div class="calendar-month" data-year="${year}" data-month="${month}" style="position:relative;">
            <div class="month-title">${monthNames[month]} ${year}</div>
            <div class="month-grid" style="position:relative;overflow:hidden;">
                ${gridHtml}
                ${overlayHtml}
            </div>
            ${legendHtml}
        </div>
    `;
}

// ============================================================
// МОДАЛКА ЧЕЛЛЕНДЖА (ПО КЛИКУ НА ЛЕГЕНДУ)
// ============================================================

function openChallengeModal(index) {
    const ch = APP.challenges[index];
    if (!ch) return;
    
    showModal('Челлендж', `
        <div style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:${ch.color};"></span>
                <h3 style="font-size:18px;font-weight:500;color:#c8d5e5;margin:0;">${ch.name}</h3>
            </div>
            <div style="font-size:14px;color:#7a8ba8;">
                <div>📅 ${ch.startDate || 'не указана'} — ${ch.endDate || 'бесконечно'}</div>
                ${ch.tempo ? `<div>⏱ Темп: ${ch.tempo} ${ch.unit || 'уроков'}</div>` : ''}
            </div>
        </div>
        <hr style="border-color:#1a2230;margin:12px 0;">
        <label>Название</label>
        <input type="text" id="editChallengeName" value="${ch.name}">
        <label>Дата начала</label>
        <input type="date" id="editChallengeStart" value="${ch.startDate || ''}">
        <label>Дата окончания</label>
        <input type="date" id="editChallengeEnd" value="${ch.endDate || ''}">
        <label>Цвет</label>
        <input type="color" id="editChallengeColor" value="${ch.color || '#e74c3c'}">
        <label>Темп</label>
        <input type="number" id="editChallengeTempo" value="${ch.tempo || ''}" placeholder="Количество за раз">
        <label>Единица темпа</label>
        <select id="editChallengeUnit">
            <option value="уроков" ${ch.unit === 'уроков' ? 'selected' : ''}>уроков</option>
            <option value="страниц" ${ch.unit === 'страниц' ? 'selected' : ''}>страниц</option>
            <option value="лекций" ${ch.unit === 'лекций' ? 'selected' : ''}>лекций</option>
        </select>
        <div class="modal-actions" style="justify-content:space-between;">
            <button class="btn-danger" onclick="deleteChallenge(${index})" style="background:#3a1a1a;color:#d46a6a;padding:8px 20px;border-radius:12px;border:none;cursor:pointer;">Удалить</button>
            <div>
                <button class="btn-secondary" onclick="closeModal()">Отмена</button>
                <button class="btn-primary" onclick="confirmEditChallenge(${index})">Сохранить</button>
            </div>
        </div>
    `);
}

function confirmEditChallenge(index) {
    const name = document.getElementById('editChallengeName').value.trim();
    if (!name) return showToast('Введите название', 'error');
    APP.challenges[index] = {
        name: name,
        startDate: document.getElementById('editChallengeStart').value || '',
        endDate: document.getElementById('editChallengeEnd').value || '',
        color: document.getElementById('editChallengeColor').value || '#e74c3c',
        tempo: document.getElementById('editChallengeTempo').value || '',
        unit: document.getElementById('editChallengeUnit').value || 'уроков'
    };
    saveAppState();
    closeModal();
    renderCalendar();
    showToast('Челлендж обновлён');
}

function deleteChallenge(index) {
    if (!confirm('Удалить челлендж навсегда?')) return;
    APP.challenges.splice(index, 1);
    saveAppState();
    closeModal();
    renderCalendar();
    showToast('Челлендж удалён');
}

// ============================================================
// СТРАНИЧКА ДНЯ (ПО КЛИКУ НА ДЕНЬ)
// ============================================================

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
    
    if (!APP.dayData[dateStr]) {
        APP.dayData[dateStr] = { todos: [], notes: '', dayFiles: [] };
    }
    const dayData = APP.dayData[dateStr];
    
    const activeChallenges = APP.challenges.filter(ch => 
        ch.startDate <= dateStr && (!ch.endDate || ch.endDate >= dateStr)
    );
    
    const recommendations = generateRecommendations(dateStr, activeChallenges);
    
    let html = `
        <!-- Рекомендации -->
        <div style="background:#1a2a2a;border-radius:12px;padding:12px;margin-bottom:16px;border:1px solid #2a4a4a;">
            <h4 style="color:#6aaa7a;font-size:13px;margin-bottom:6px;">Рекомендации</h4>
            ${recommendations.length > 0 ? 
                recommendations.map(rec => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:14px;color:#aabbcc;">
                        <span>${rec.text}</span>
                        <button onclick="addRecommendedTodo('${dateStr}', '${rec.text}', '${rec.color}')" 
                                style="background:#2a4a4a;border:none;color:#aabbcc;padding:2px 12px;border-radius:12px;cursor:pointer;font-size:12px;">
                            + Добавить
                        </button>
                    </div>
                `).join('') : 
                '<div class="text-muted" style="font-size:13px;">Нет рекомендаций</div>'
            }
        </div>
        
        <!-- Дела -->
        <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <h4 style="color:#7a8ba8;font-size:14px;">Дела</h4>
                <div style="display:flex;gap:6px;">
                    <button onclick="addTodo('${dateStr}')" style="padding:4px 14px;border-radius:16px;border:1px solid #2a4a5a;background:transparent;color:#6a9aaa;cursor:pointer;font-size:12px;">+ Дело</button>
                    <button onclick="addEvent('${dateStr}')" style="padding:4px 14px;border-radius:16px;border:1px solid #2a4a5a;background:transparent;color:#6a9aaa;cursor:pointer;font-size:12px;">+ Событие</button>
                </div>
            </div>
            <div id="dayTodoList">
                ${dayData.todos.length > 0 ? 
                    dayData.todos.map((todo, i) => `
                        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#10161e;border-radius:8px;margin-bottom:4px;border-left:3px solid ${todo.color || '#2a3344'};">
                            <div onclick="toggleTodo('${dateStr}', ${i})" style="width:20px;height:20px;border-radius:6px;border:2px solid ${todo.done ? '#4a7a5a' : '#3a4a5a'};background:${todo.done ? '#1a3a2a' : 'transparent'};cursor:pointer;display:flex;align-items:center;justify-content:center;">
                                ${todo.done ? '<span style="color:#6aaa7a;font-size:14px;">✓</span>' : ''}
                            </div>
                            <span style="flex:1;font-size:14px;${todo.done ? 'opacity:0.4;' : ''}">${todo.text}</span>
                            <button onclick="deleteTodo('${dateStr}', ${i})" style="background:none;border:none;color:#5a4a4a;cursor:pointer;">✕</button>
                        </div>
                    `).join('') : 
                    '<div class="text-muted" style="font-size:13px;">Нет дел</div>'
                }
            </div>
        </div>
        
        <!-- Заметки -->
        <div style="margin-bottom:16px;">
            <h4 style="color:#7a8ba8;font-size:14px;margin-bottom:4px;">Заметки</h4>
            <textarea id="dayNotes" style="width:100%;min-height:80px;padding:10px 14px;border-radius:10px;border:1px solid #1f2838;background:#0b0e14;color:#e8edf5;font-size:14px;font-family:inherit;resize:vertical;outline:none;">${dayData.notes || ''}</textarea>
        </div>
        
        <!-- Файлы -->
        <div style="margin-bottom:16px;">
            <h4 style="color:#7a8ba8;font-size:14px;margin-bottom:4px;">Файлы дня</h4>
            <div id="dayFilesList" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                ${dayData.dayFiles && dayData.dayFiles.length > 0 ? 
                    dayData.dayFiles.map(f => `
                        <span style="background:#1a2230;padding:4px 12px;border-radius:12px;font-size:12px;color:#7a8ba8;display:flex;align-items:center;gap:6px;">
                            ${f}
                            <span onclick="removeDayFile('${dateStr}', '${f}')" style="cursor:pointer;color:#5a4a4a;font-size:14px;">✕</span>
                        </span>
                    `).join('') : 
                    '<span class="text-muted" style="font-size:13px;">Нет файлов</span>'
                }
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button onclick="uploadDayFile('${dateStr}')" style="padding:6px 16px;border-radius:20px;border:1px solid #2a3344;background:transparent;color:#aabbcc;cursor:pointer;font-size:13px;">Загрузить файл</button>
                <button onclick="uploadDayPhoto('${dateStr}')" style="padding:6px 16px;border-radius:20px;border:1px solid #2a3344;background:transparent;color:#aabbcc;cursor:pointer;font-size:13px;">Загрузить фото</button>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn-secondary" onclick="saveDayData('${dateStr}')">Сохранить заметки</button>
            <button class="btn-secondary" onclick="closeDayModal()">Закрыть</button>
        </div>
    `;
    
    content.innerHTML = html;
    modal.classList.add('open');
}

function closeDayModal() {
    document.getElementById('dayModal').classList.remove('open');
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function generateRecommendations(dateStr, activeChallenges) {
    const recommendations = [];
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
    
    for (let ch of activeChallenges) {
        const done = doneCounts[ch.name] || 0;
        const tempo = parseInt(ch.tempo) || 1;
        const unit = ch.unit || 'уроков';
        const dayOfMonth = parseInt(dateStr.split('-')[2]);
        const expected = Math.ceil(dayOfMonth / 30 * tempo * 30 / 30) || 1;
        if (done < expected) {
            recommendations.push({
                text: `${ch.name}: сделать ${tempo} ${unit}`,
                color: ch.color,
                challenge: ch.name
            });
        }
    }
    return recommendations;
}

function addRecommendedTodo(dateStr, text, color) {
    if (!APP.dayData[dateStr]) {
        APP.dayData[dateStr] = { todos: [], notes: '', dayFiles: [] };
    }
    APP.dayData[dateStr].todos.push({
        text: text,
        done: false,
        color: color || '#2a3344',
        challenge: text.split(':')[0] || null
    });
    saveAppState();
    openDayModal(dateStr);
    showToast('Дело добавлено');
}

function addTodo(dateStr) {
    showModal('Добавить дело', `
        <label>Текст дела</label>
        <input type="text" id="newTodoText" placeholder="Что нужно сделать?" autofocus>
        <label>Челлендж</label>
        <select id="newTodoChallenge">
            <option value="">—</option>
            ${APP.challenges.map(ch => `<option value="${ch.name}" data-color="${ch.color || '#2a3344'}">${ch.name}</option>`).join('')}
        </select>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddTodo('${dateStr}')">Добавить</button>
        </div>
    `);
}

function confirmAddTodo(dateStr) {
    const text = document.getElementById('newTodoText').value.trim();
    if (!text) return showToast('Введите текст', 'error');
    const challengeName = document.getElementById('newTodoChallenge').value;
    const challenge = APP.challenges.find(c => c.name === challengeName);
    const color = challenge ? challenge.color : '#2a3344';
    
    if (!APP.dayData[dateStr]) {
        APP.dayData[dateStr] = { todos: [], notes: '', dayFiles: [] };
    }
    APP.dayData[dateStr].todos.push({
        text: text,
        done: false,
        color: color,
        challenge: challengeName || null
    });
    saveAppState();
    closeModal();
    openDayModal(dateStr);
    showToast('Дело добавлено');
}

function addEvent(dateStr) {
    showModal('Добавить событие', `
        <label>Название события</label>
        <input type="text" id="eventText" placeholder="Название события" autofocus>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddEvent('${dateStr}')">Добавить</button>
        </div>
    `);
}

function confirmAddEvent(dateStr) {
    const text = document.getElementById('eventText').value.trim();
    if (!text) return showToast('Введите название', 'error');
    if (!APP.events) APP.events = [];
    APP.events.push({ text: text, date: dateStr });
    saveAppState();
    closeModal();
    openDayModal(dateStr);
    showToast('Событие добавлено');
}

function toggleTodo(dateStr, index) {
    if (!APP.dayData[dateStr]) return;
    APP.dayData[dateStr].todos[index].done = !APP.dayData[dateStr].todos[index].done;
    saveAppState();
    openDayModal(dateStr);
}

function deleteTodo(dateStr, index) {
    if (!confirm('Удалить дело?')) return;
    APP.dayData[dateStr].todos.splice(index, 1);
    saveAppState();
    openDayModal(dateStr);
    showToast('Дело удалено');
}

function saveDayData(dateStr) {
    const notes = document.getElementById('dayNotes');
    if (notes && APP.dayData[dateStr]) {
        APP.dayData[dateStr].notes = notes.value;
        saveAppState();
        showToast('Заметки сохранены');
    }
}

async function uploadDayFile(dateStr) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const path = `Хроника/Календарь/${dateStr}/файлы_дня`;
        await teraboxCreateFolder(path);
        await teraboxUploadFile(path, file, { source: 'day', date: dateStr });
        if (!APP.dayData[dateStr]) {
            APP.dayData[dateStr] = { todos: [], notes: '', dayFiles: [] };
        }
        if (!APP.dayData[dateStr].dayFiles) APP.dayData[dateStr].dayFiles = [];
        APP.dayData[dateStr].dayFiles.push(file.name);
        saveAppState();
        openDayModal(dateStr);
        showToast('Файл загружен');
    };
    input.click();
}

async function uploadDayPhoto(dateStr) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const path = `Хроника/Фото`;
        await teraboxCreateFolder(path);
        const newName = `${dateStr}_${file.name}`;
        const renamed = new File([file], newName, { type: file.type });
        await teraboxUploadFile(path, renamed, { source: 'photo', date: dateStr });
        if (!APP.dayData[dateStr]) {
            APP.dayData[dateStr] = { todos: [], notes: '', dayFiles: [] };
        }
        if (!APP.dayData[dateStr].dayFiles) APP.dayData[dateStr].dayFiles = [];
        APP.dayData[dateStr].dayFiles.push(newName);
        saveAppState();
        openDayModal(dateStr);
        showToast('Фото загружено');
    };
    input.click();
}

function removeDayFile(dateStr, fileName) {
    if (!confirm('Удалить файл?')) return;
    APP.dayData[dateStr].dayFiles = APP.dayData[dateStr].dayFiles.filter(f => f !== fileName);
    saveAppState();
    openDayModal(dateStr);
    showToast('Файл удалён');
}