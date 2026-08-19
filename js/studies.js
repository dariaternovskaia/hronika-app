// ============================================================
// УЧЕБНЫЕ МАТЕРИАЛЫ
// ============================================================

let currentStudy = 'matematika';

function renderStudies() {
    const container = document.getElementById('studiesContent');
    const subject = currentStudy;
    const data = APP.studies[subject] || { files: [], links: [] };
    
    let html = '';
    
    // Файлы
    html += `<h4 style="color:#7a8ba8;margin-bottom:8px;">Файлы</h4>`;
    if (data.files.length > 0) {
        for (let f of data.files) {
            html += `
                <div class="file-item">
                    <span class="file-name">${f}</span>
                    <div class="file-actions">
                        <button onclick="deleteStudyFile('${subject}', '${f}')">✕</button>
                    </div>
                </div>
            `;
        }
    } else {
        html += `<div class="text-muted" style="padding:8px 0;">Нет файлов</div>`;
    }
    
    // Ссылки
    html += `<h4 style="color:#7a8ba8;margin:16px 0 8px;">Ссылки</h4>`;
    if (data.links.length > 0) {
        for (let link of data.links) {
            html += `
                <div class="link-item">
                    <a href="${link.url}" target="_blank">${link.title || link.url}</a>
                    <div class="file-actions">
                        <button onclick="deleteStudyLink('${subject}', '${link.url}')">✕</button>
                    </div>
                </div>
            `;
        }
    } else {
        html += `<div class="text-muted" style="padding:8px 0;">Нет ссылок</div>`;
    }
    
    // Действия
    html += `
        <div class="studies-actions">
            <button onclick="uploadStudyFile('${subject}')">Загрузить файл</button>
            <button onclick="addStudyLink('${subject}')">Добавить ссылку</button>
        </div>
    `;
    
    container.innerHTML = html;
}

function uploadStudyFile(subject) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const path = `Хроника/Учебные материалы/${subject}`;
        await teraboxCreateFolder(path);
        await teraboxUploadFile(path, file, { source: 'study' });
        if (!APP.studies[subject]) APP.studies[subject] = { files: [], links: [] };
        APP.studies[subject].files.push(file.name);
        saveAppState();
        renderStudies();
        showToast('Файл загружен');
    };
    input.click();
}

function deleteStudyFile(subject, fileName) {
    if (!confirm(`Удалить файл "${fileName}"?`)) return;
    APP.studies[subject].files = APP.studies[subject].files.filter(f => f !== fileName);
    saveAppState();
    renderStudies();
    showToast('Файл удалён');
}

function addStudyLink(subject) {
    showModal('Добавить ссылку', `
        <label>Название (необязательно)</label>
        <input type="text" id="linkTitle" placeholder="Название ссылки">
        <label>URL</label>
        <input type="url" id="linkUrl" placeholder="https://example.com">
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddStudyLink('${subject}')">Добавить</button>
        </div>
    `);
}

function confirmAddStudyLink(subject) {
    const url = document.getElementById('linkUrl').value.trim();
    if (!url) return showToast('Введите URL', 'error');
    const title = document.getElementById('linkTitle').value.trim() || url;
    if (!APP.studies[subject]) APP.studies[subject] = { files: [], links: [] };
    APP.studies[subject].links.push({ title, url });
    saveAppState();
    closeModal();
    renderStudies();
    showToast('Ссылка добавлена');
}

function deleteStudyLink(subject, url) {
    APP.studies[subject].links = APP.studies[subject].links.filter(l => l.url !== url);
    saveAppState();
    renderStudies();
    showToast('Ссылка удалена');
}

document.querySelectorAll('.studies-nav button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.studies-nav button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentStudy = this.dataset.study;
        renderStudies();
    });
});