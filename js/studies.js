let studiesData = [];
const studiesRef = window.firebaseRef(window.firebaseDB, 'studies');

async function loadStudies() {
    try {
        const snapshot = await window.firebaseGet(studiesRef);
        if (snapshot.exists()) {
            studiesData = snapshot.val();
        } else {
            studiesData = [];
        }
    } catch (err) {
        console.error('Ошибка загрузки учебных материалов:', err);
        studiesData = [];
    }
}

async function saveStudies() {
    try {
        await window.firebaseSet(studiesRef, studiesData);
    } catch (err) {
        console.error('Ошибка сохранения:', err);
    }
}

const subjects = {
    math: { name: 'Математика', color: '#2a4a6a' },
    philosophy: { name: 'Философия', color: '#4a2a6a' },
    linguistics: { name: 'Языкознание', color: '#2a6a4a' }
};

let currentSubject = 'math';
let currentFolderId = null;

async function renderStudies() {
    const container = document.getElementById('studyContent');
    if (!container) return;

    await loadStudies();

    let html = '';

    html += `<div style="display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;">`;
    Object.keys(subjects).forEach(key => {
        const s = subjects[key];
        const isActive = currentSubject === key;
        html += `<button onclick="switchSubject('${key}')" style="
            padding:10px 24px; border-radius:12px;
            border:1px solid ${isActive ? s.color : '#1f2838'};
            background:${isActive ? s.color : '#141a24'};
            color:${isActive ? '#e8edf5' : '#7a8ba8'};
            font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.2s;
        ">${s.name}</button>`;
    });
    html += `</div>`;

    const breadcrumbs = [];
    if (currentFolderId) {
        let fid = currentFolderId;
        while (fid) {
            const f = studiesData.find(x => x.id === fid);
            if (f) { breadcrumbs.unshift(f); fid = f.parentId; } else { break; }
        }
    }

    html += `<div style="margin-bottom:16px;font-size:13px;color:#7a8ba8;">`;
    html += `<span style="cursor:pointer;color:#aabbcc;" onclick="goToRoot()">${subjects[currentSubject].name}</span>`;
    breadcrumbs.forEach(f => {
        html += ` <span style="color:#5a6a7a;">/</span> <span style="cursor:pointer;color:#aabbcc;" onclick="openFolder('${f.id}')">${f.name}</span>`;
    });
    html += `</div>`;

    html += `<div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">`;
    html += `<button onclick="createFolder()" style="background:#1a2230;color:#e8edf5;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">+ Новая папка</button>`;
    html += `<button onclick="addItem('file')" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">+ Добавить файл</button>`;
    html += `<button onclick="addItem('link')" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">+ Добавить ссылку</button>`;
    html += `<button onclick="exportStudies()" style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">📥 Экспорт</button>`;
    html += `<label style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">📤 Импорт<input type="file" id="importStudiesFile" accept=".json" style="display:none;" onchange="importStudies(this.files[0])" /></label>`;
    html += `</div>`;

    const childFolders = studiesData.filter(f => f.subject === currentSubject && f.parentId === currentFolderId);
    
    if (childFolders.length > 0) {
        html += `<div style="margin-bottom:20px;"><div style="font-size:12px;color:#7a8ba8;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Папки</div>`;
        childFolders.forEach(folder => {
            const itemCount = folder.items ? folder.items.length : 0;
            html += `<div style="background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='#1a2230'" onmouseout="this.style.background='#141a24'" onclick="openFolder('${folder.id}')">
                <div style="flex:1;"><div style="font-size:15px;font-weight:500;color:#e8edf5;margin-bottom:2px;">📁 ${folder.name}</div><div style="font-size:12px;color:#7a8ba8;">${itemCount} элемент(ов)</div></div>
                <button onclick="event.stopPropagation();deleteFolderPrompt('${folder.id}')" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;">Удалить</button>
            </div>`;
        });
        html += `</div>`;
    }

    const rootFolderId = currentSubject + '_root';
    const rootFolder = studiesData.find(f => f.id === rootFolderId);
    let displayItems = [];
    
    if (currentFolderId === null) {
        if (rootFolder && rootFolder.items) displayItems = rootFolder.items.map(item => ({ ...item, folderName: subjects[currentSubject].name, folderId: rootFolderId }));
    } else {
        studiesData.filter(f => f.subject === currentSubject).forEach(f => {
            if (f.parentId === currentFolderId && f.items) {
                f.items.forEach(item => displayItems.push({ ...item, folderName: f.name, folderId: f.id }));
            }
        });
    }

    if (displayItems.length > 0) {
        html += `<div><div style="font-size:12px;color:#7a8ba8;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Файлы и ссылки</div>`;
        displayItems.forEach(item => {
            html += `<div style="background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:14px 16px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:500;color:#e8edf5;margin-bottom:4px;word-break:break-word;">${getFileIcon(item.type, item.fileType)} ${item.name}</div>
                        <div style="font-size:12px;color:#7a8ba8;margin-bottom:6px;">${item.type === 'link' ? '🔗 Ссылка' : '📄 Файл'} • ${item.addedDate}</div>
                        ${item.comment ? `<div style="font-size:13px;color:#aabbcc;margin-bottom:8px;font-style:italic;">${item.comment}</div>` : ''}
                        ${item.type === 'link' ? `<a href="${item.url}" target="_blank" style="color:#6a9aaa;text-decoration:none;font-size:13px;">Открыть ссылку →</a>` : ''}
                        ${item.type === 'file' && item.fileType === 'image' ? `<img src="${item.url}" style="max-width:200px;border-radius:8px;margin-top:8px;cursor:pointer;" onclick="viewImage('${item.url}')" />` : ''}
                        ${item.type === 'file' && item.fileType === 'audio' ? `<audio controls src="${item.url}" style="width:100%;max-width:400px;margin-top:8px;"></audio>` : ''}
                        ${item.type === 'file' && item.fileType === 'video' ? `<video controls src="${item.url}" style="max-width:100%;border-radius:8px;margin-top:8px;max-height:300px;"></video>` : ''}
                        ${item.type === 'file' && item.fileType === 'pdf' ? `<a href="${item.url}" target="_blank" style="color:#6a9aaa;text-decoration:none;font-size:13px;">Открыть PDF →</a>` : ''}
                    </div>
                    <button onclick="deleteItem('${item.id}', '${item.folderId}')" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;margin-left:12px;flex-shrink:0;">Удалить</button>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    if (childFolders.length === 0 && displayItems.length === 0) {
        html += `<div style="text-align:center;padding:40px;color:#7a8ba8;font-size:15px;">Пока пусто. Создай папку или добавь файл/ссылку.</div>`;
    }

    container.innerHTML = html;
}

function getFileIcon(type, fileType) {
    if (type === 'link') return '🔗';
    const icons = { pdf: '📕', audio: '🎵', video: '🎬', image: '🖼️', other: '📄' };
    return icons[fileType] || '📄';
}

function viewImage(url) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer;';
    modal.onclick = () => modal.remove();
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;';
    modal.appendChild(img);
    document.body.appendChild(modal);
}

function switchSubject(subject) { currentSubject = subject; currentFolderId = null; renderStudies(); }
function openFolder(id) { currentFolderId = id; renderStudies(); }
function goToRoot() { currentFolderId = null; renderStudies(); }

async function createFolder() {
    const name = prompt('Название папки:');
    if (!name || !name.trim()) return;
    studiesData.push({ id: 'folder_' + Date.now(), name: name.trim(), subject: currentSubject, parentId: currentFolderId, items: [] });
    await saveStudies();
    renderStudies();
}

async function deleteFolderPrompt(id) {
    if (!confirm('Удалить папку и всё её содержимое?')) return;
    studiesData = studiesData.filter(f => f.id !== id);
    await saveStudies();
    renderStudies();
}

async function addItem(type) {
    const targetFolderId = currentFolderId || (currentSubject + '_root');
    if (type === 'link') {
        const name = prompt('Название ссылки:'); if (!name) return;
        const url = prompt('URL ссылки:'); if (!url) return;
        const comment = prompt('Комментарий (необязательно):') || '';
        let folder = studiesData.find(f => f.id === targetFolderId);
        if (!folder) { folder = { id: targetFolderId, name: subjects[currentSubject].name, subject: currentSubject, parentId: null, items: [] }; studiesData.push(folder); }
        folder.items = folder.items || [];
        folder.items.push({ id: 'item_' + Date.now(), type: 'link', name: name.trim(), url: url.trim(), addedDate: new Date().toISOString().split('T')[0], comment: comment.trim() });
        await saveStudies();
        renderStudies();
    } else if (type === 'file') {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '*/*';
        input.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const name = prompt('Название (по умолчанию: ' + file.name + '):', file.name); if (!name) return;
            const comment = prompt('Комментарий (необязательно):') || '';
            let fileType = 'other';
            if (file.type === 'application/pdf') fileType = 'pdf';
            else if (file.type.startsWith('audio/')) fileType = 'audio';
            else if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('image/')) fileType = 'image';

            const reader = new FileReader();
            reader.onload = async (event) => {
                let folder = studiesData.find(f => f.id === targetFolderId);
                if (!folder) { folder = { id: targetFolderId, name: subjects[currentSubject].name, subject: currentSubject, parentId: null, items: [] }; studiesData.push(folder); }
                folder.items = folder.items || [];
                folder.items.push({ id: 'item_' + Date.now(), type: 'file', name: name.trim(), url: event.target.result, fileType: fileType, addedDate: new Date().toISOString().split('T')[0], comment: comment.trim() });
                await saveStudies();
                renderStudies();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
}

async function deleteItem(itemId, folderId) {
    if (!confirm('Удалить этот элемент?')) return;
    const folder = studiesData.find(f => f.id === folderId);
    if (folder) { folder.items = folder.items.filter(item => item.id !== itemId); await saveStudies(); renderStudies(); }
}

async function exportStudies() {
    const dataStr = JSON.stringify(studiesData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `hronika-studies-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    alert('✅ Файл сохранён!');
}

async function importStudies(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) { alert('❌ Неверный формат'); return; }
            if (confirm(`Импортировать ${imported.length} записей? Текущие данные будут заменены.`)) {
                studiesData = imported;
                await saveStudies();
                renderStudies();
                alert('✅ Импорт завершён!');
            }
        } catch (err) { alert('❌ Ошибка: ' + err.message); }
    };
    reader.readAsText(file);
}

window.renderStudies = renderStudies;
window.switchSubject = switchSubject;
window.openFolder = openFolder;
window.goToRoot = goToRoot;
window.createFolder = createFolder;
window.deleteFolderPrompt = deleteFolderPrompt;
window.addItem = addItem;
window.deleteItem = deleteItem;
window.exportStudies = exportStudies;
window.importStudies = importStudies;
window.viewImage = viewImage;