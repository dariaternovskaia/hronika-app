// ============================================================
// УПРАВЛЕНИЕ ЧЕЛЛЕНДЖАМИ
// ============================================================

function renderChallenges() {
    const container = document.getElementById('challengesList');
    if (!APP.challenges || APP.challenges.length === 0) {
        container.innerHTML = '<div class="text-muted">Нет челленджей. Добавьте первый!</div>';
        return;
    }
    let html = '';
    for (let ch of APP.challenges) {
        const color = ch.color || '#2a3344';
        const subject = ch.subject || '';
        const type = ch.type || '';
        const tempo = ch.tempo || '';
        const unit = ch.unit || '';
        html += `
            <div class="challenge-item" style="border-left-color:${color};">
                <div class="info">
                    <div class="name" style="color:${color};">${escHtml(ch.name)}</div>
                    <div class="meta">
                        ${ch.startDate || ''} — ${ch.endDate || 'бесконечно'} 
                        ${subject ? '| ' + subject : ''} ${type ? '| ' + type : ''}
                        ${tempo ? '| Темп: ' + tempo + ' ' + unit : ''}
                    </div>
                </div>
                <div class="actions">
                    <button onclick="editChallenge(${APP.challenges.indexOf(ch)})">✎</button>
                    <button onclick="deleteChallenge(${APP.challenges.indexOf(ch)})">✕</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function addChallenge() {
    showModal('Добавить челлендж', `
        <label>Название</label>
        <input type="text" id="challengeName" placeholder="Название челленджа">
        <label>Дата начала</label>
        <input type="date" id="challengeStart" value="${new Date().toISOString().slice(0,10)}">
        <label>Дата окончания (оставьте пустым, если бесконечно)</label>
        <input type="date" id="challengeEnd">
        <label>Цвет</label>
        <input type="color" id="challengeColor" value="#e74c3c">
        <label>Предмет</label>
        <select id="challengeSubject">
            <option value="">—</option>
            <option value="matematika">Математика</option>
            <option value="filosofiya">Философия</option>
            <option value="yazyki">Языки</option>
        </select>
        <label>Тип</label>
        <select id="challengeType">
            <option value="">—</option>
            <option value="book">Книга</option>
            <option value="course">Курс</option>
        </select>
        <label>Темп (количество за раз)</label>
        <input type="number" id="challengeTempo" placeholder="2">
        <label>Единица темпа</label>
        <select id="challengeUnit">
            <option value="уроков">уроков</option>
            <option value="страниц">страниц</option>
            <option value="лекций">лекций</option>
        </select>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddChallenge()">Добавить</button>
        </div>
    `);
}

function confirmAddChallenge() {
    const name = document.getElementById('challengeName').value.trim();
    if (!name) return showToast('Введите название', 'error');
    APP.challenges.push({
        name: name,
        startDate: document.getElementById('challengeStart').value || '',
        endDate: document.getElementById('challengeEnd').value || '',
        color: document.getElementById('challengeColor').value || '#e74c3c',
        subject: document.getElementById('challengeSubject').value || '',
        type: document.getElementById('challengeType').value || '',
        tempo: document.getElementById('challengeTempo').value || '',
        unit: document.getElementById('challengeUnit').value || 'уроков'
    });
    saveAppState();
    renderChallenges();
    closeModal();
    showToast('Челлендж добавлен');
}

function editChallenge(index) {
    const ch = APP.challenges[index];
    if (!ch) return;
    showModal('Редактировать челлендж', `
        <label>Название</label>
        <input type="text" id="editChallengeName" value="${escHtml(ch.name)}">
        <label>Дата начала</label>
        <input type="date" id="editChallengeStart" value="${ch.startDate || ''}">
        <label>Дата окончания</label>
        <input type="date" id="editChallengeEnd" value="${ch.endDate || ''}">
        <label>Цвет</label>
        <input type="color" id="editChallengeColor" value="${ch.color || '#e74c3c'}">
        <label>Предмет</label>
        <select id="editChallengeSubject">
            <option value="">—</option>
            <option value="matematika" ${ch.subject === 'matematika' ? 'selected' : ''}>Математика</option>
            <option value="filosofiya" ${ch.subject === 'filosofiya' ? 'selected' : ''}>Философия</option>
            <option value="yazyki" ${ch.subject === 'yazyki' ? 'selected' : ''}>Языки</option>
        </select>
        <label>Тип</label>
        <select id="editChallengeType">
            <option value="">—</option>
            <option value="book" ${ch.type === 'book' ? 'selected' : ''}>Книга</option>
            <option value="course" ${ch.type === 'course' ? 'selected' : ''}>Курс</option>
        </select>
        <label>Темп</label>
        <input type="number" id="editChallengeTempo" value="${ch.tempo || ''}">
        <label>Единица темпа</label>
        <select id="editChallengeUnit">
            <option value="уроков" ${ch.unit === 'уроков' ? 'selected' : ''}>уроков</option>
            <option value="страниц" ${ch.unit === 'страниц' ? 'selected' : ''}>страниц</option>
            <option value="лекций" ${ch.unit === 'лекций' ? 'selected' : ''}>лекций</option>
        </select>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmEditChallenge(${index})">Сохранить</button>
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
        subject: document.getElementById('editChallengeSubject').value || '',
        type: document.getElementById('editChallengeType').value || '',
        tempo: document.getElementById('editChallengeTempo').value || '',
        unit: document.getElementById('editChallengeUnit').value || 'уроков'
    };
    saveAppState();
    renderChallenges();
    closeModal();
    showToast('Челлендж обновлён');
}

function deleteChallenge(index) {
    if (!confirm('Удалить челлендж?')) return;
    APP.challenges.splice(index, 1);
    saveAppState();
    renderChallenges();
    showToast('Челлендж удалён');
}