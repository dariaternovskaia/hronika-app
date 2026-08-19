// ============================================================
// УЧЕБНЫЕ МАТЕРИАЛЫ (С ВОЗМОЖНОСТЬЮ СОЗДАВАТЬ ПАПКИ)
// ============================================================

let currentStudy = 'matematika';

function renderStudies() {
    const container = document.getElementById('studiesContent');
    const subject = currentStudy;
    const data = APP.studies[subject] || { files: [], links: [], folders: [] };
    
    let html = '';
    
    // Папки
    html += `<h4 style="color:#7a8ba8;margin-bottom:8px;">Папки</h4>`;
    if (data.folders && data.folders.length > 0) {
        for (let folder of data.folders) {
            html += `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#141a24;border-radius:8px;margin-bottom:4px;">
                    <span style="font-size:14px;color:#aabbcc;">📁 ${folder}</span>
                    <div>
                        <button onclick="openFolder('${subject}', '${folder}')" style="background:none;border:none;color:#5a6a7a;cursor:pointer;font-size:13px;">Открыть</button>
                        <button onclick="deleteFolder('${subject}', '${folder}')" style="background:none;border:none;color:#5a4a4a;cursor:pointer;font-size:13px;">✕</button>
                    </div>
                </div>
            `;
        }
    } else {
        html += `<div class="text-muted" style="padding:8px 0;">Нет папок</div>`;
    }
    
    // Файлы
    html += `<h4 style="color:#7a8ba8;margin:16px 0 8px;">Файлы</h4>`;
    if (data.files && data.files.length > 0) {
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
    if (data.links && data.links.length > 0) {
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
            <button onclick="createFolder('${subject}')">📁 Создать папку</button>
            <button onclick="uploadStudyFile('${subject}')">Загрузить файл</button>
            <button onclick="addStudyLink('${subject}')">Добавить ссылку</button>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================
// УПРАВЛЕНИЕ ПАПКАМИ
// ============================================================

function createFolder(subject) {
    showModal('Создать папку', `
        <label>Название папки</label>
        <input type="text" id="newFolderName" placeholder="Новая папка" autofocus>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmCreateFolder('${subject}')">Создать</button>
        </div>
    `);
}

function confirmCreateFolder(subject) {
    const name = document.getElementById('newFolderName').value.trim();
    if (!name) return showToast('Введите название', 'error');
    if (!APP.studies[subject]) APP.studies[subject] = { files: [], links: [], folders: [] };
    if (!APP.studies[subject].folders) APP.studies[subject].folders = [];
    if (APP.studies[subject].folders.includes(name)) {
        return showToast('Папка уже существует', 'error');
    }
    APP.studies[subject].folders.push(name);
    saveAppState();
    closeModal();
    renderStudies();
    showToast('Папка создана');
}

function deleteFolder(subject, folderName) {
    if (!confirm(`Удалить папку "${folderName}"?`)) return;
    APP.studies[subject].folders = APP.studies[subject].folders.filter(f => f !== folderName);
    saveAppState();
    renderStudies();
    showToast('Папка удалена');
}

function openFolder(subject, folderName) {
    showToast(`Открыта папка: ${folderName} (вложенная структура пока в разработке)`);
    // Здесь можно реализовать переход внутрь папки, если нужно
}

// ============================================================
// УПРАВЛЕНИЕ ФАЙЛАМИ И ССЫЛКАМИ
// ============================================================

function uploadStudyFile(subject) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const path = `Хроника/Учебные материалы/${subject}`;
        await teraboxCreateFolder(path);
        await teraboxUploadFile(path, file, { source: 'study' });
        if (!APP.studies[subject]) APP.studies[subject] = { files: [], links: [], folders: [] };
        if (!APP.studies[subject].files) APP.studies[subject].files = [];
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
    if (!APP.studies[subject]) APP.studies[subject] = { files: [], links: [], folders: [] };
    if (!APP.studies[subject].links) APP.studies[subject].links = [];
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

// Переключение подразделов
document.querySelectorAll('.studies-nav button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.studies-nav button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentStudy = this.dataset.study;
        renderStudies();
    });
});