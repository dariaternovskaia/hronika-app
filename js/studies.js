// ========== ДАННЫЕ ==========
let studiesData = [];
const STORAGE_KEY = 'hronika_studies';

function loadStudies() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        studiesData = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(studiesData)) studiesData = [];
        console.log('📚 Загружено папок:', studiesData.length);
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        studiesData = [];
    }
}

function saveStudies() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(studiesData));
        console.log('💾 Сохранено папок:', studiesData.length);
    } catch (e) {
        alert('️ Не удалось сохранить: превышен лимит хранилища.');
        console.error(e);
    }
}

const subjects = {
    math: { name: 'Математика', color: '#2a4a6a' },
    philosophy: { name: 'Философия', color: '#4a2a6a' },
    linguistics: { name: 'Языкознание', color: '#2a6a4a' }
};

let currentSubject = 'math';
let currentFolderId = null;

// ========== УТИЛИТЫ ==========
function findFolder(id) {
    const folder = studiesData.find(f => f.id === id);
    console.log('🔍 findFolder(', id, ') →', folder ? folder.name : 'не найдена');
    return folder;
}

function getCurrentFolder() {
    if (currentFolderId === null) {
        // Корень раздела — создаём виртуальную папку
        return {
            id: 'root_' + currentSubject,
            name: subjects[currentSubject].name,
            subject: currentSubject,
            parentId: null,
            items: getRootItems()
        };
    }
    return findFolder(currentFolderId);
}

function getRootItems() {
    // Файлы, которые лежат прямо в корне раздела (не в папках)
    const rootFolder = studiesData.find(f => f.id === 'root_' + currentSubject);
    return rootFolder ? (rootFolder.items || []) : [];
}

function saveRootItems(items) {
    let rootFolder = studiesData.find(f => f.id === 'root_' + currentSubject);
    if (!rootFolder) {
        rootFolder = {
            id: 'root_' + currentSubject,
            name: subjects[currentSubject].name,
            subject: currentSubject,
            parentId: null,
            items: []
        };
        studiesData.push(rootFolder);
    }
    rootFolder.items = items;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getFileIcon(type, fileType) {
    if (type === 'link') return '';
    const icons = { pdf: '📕', audio: '🎵', video: '🎬', image: '️' };
    return icons[fileType] || '';
}

// ========== ОТРИСОВКА ==========
async function renderStudies() {
    const container = document.getElementById('studyContent');
    if (!container) return;
    
    loadStudies();
    
    console.log('📊 renderStudies:', {
        subject: currentSubject,
        currentFolderId: currentFolderId,
        totalFolders: studiesData.length
    });

    let html = '';

    // Вкладки предметов
    html += `<div style="display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;">`;
    Object.keys(subjects).forEach(key => {
        const s = subjects[key];
        const isActive = currentSubject === key;
        html += `<button onclick="window.switchSubject('${key}')" style="padding:10px 24px;border-radius:12px;border:1px solid ${isActive ? s.color : '#1f2838'};background:${isActive ? s.color : '#141a24'};color:${isActive ? '#e8edf5' : '#7a8ba8'};font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;">${s.name}</button>`;
    });
    html += `</div>`;

    // Хлебные крошки
    const breadcrumbs = [];
    if (currentFolderId) {
        let fid = currentFolderId;
        const visited = new Set();
        while (fid && !visited.has(fid)) {
            visited.add(fid);
            const f = findFolder(fid);
            if (f) {
                breadcrumbs.unshift(f);
                fid = f.parentId;
            } else {
                break;
            }
        }
    }

    html += `<div style="margin-bottom:16px;font-size:13px;color:#7a8ba8;">`;
    html += `<span style="cursor:pointer;color:#aabbcc;" onclick="window.goToRoot()">${subjects[currentSubject].name}</span>`;
    breadcrumbs.forEach(f => {
        html += ` <span style="color:#5a6a7a;">/</span> <span style="cursor:pointer;color:#aabbcc;" onclick="window.openFolder('${f.id}')">${escapeHtml(f.name)}</span>`;
    });
    html += `</div>`;

    // Кнопки
    html += `<div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">`;
    html += `<button onclick="window.createFolder()" style="background:#1a2230;color:#e8edf5;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">+ Новая папка</button>`;
    html += `<button onclick="window.addItem('file')" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">+ Добавить файл</button>`;
    html += `<button onclick="window.addItem('link')" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">+ Добавить ссылку</button>`;
    html += `</div>`;

    // Текущая папка
    const currentFolder = getCurrentFolder();
    if (!currentFolder) {
        html += `<div style="text-align:center;padding:40px;color:#7a8ba8;">Ошибка: папка не найдена</div>`;
        container.innerHTML = html;
        return;
    }

    console.log('📁 Текущая папка:', currentFolder.name, 'ID:', currentFolder.id);

    // Подпапки
    const childFolders = studiesData.filter(f => f.subject === currentSubject && f.parentId === currentFolder.id);
    console.log(' Подпапок:', childFolders.length);
    
    if (childFolders.length > 0) {
        html += `<div style="margin-bottom:20px;"><div style="font-size:12px;color:#7a8ba8;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Папки</div>`;
        childFolders.forEach(folder => {
            const itemCount = folder.items ? folder.items.length : 0;
            html += `<div style="background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onmouseover="this.style.background='#1a2230'" onmouseout="this.style.background='#141a24'" onclick="window.openFolder('${folder.id}')">
                <div style="flex:1;"><div style="font-size:15px;font-weight:500;color:#e8edf5;margin-bottom:2px;">📁 ${escapeHtml(folder.name)}</div><div style="font-size:12px;color:#7a8ba8;">${itemCount} элемент(ов)</div></div>
                <button onclick="event.stopPropagation();window.deleteFolderPrompt('${folder.id}')" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;">Удалить</button>
            </div>`;
        });
        html += `</div>`;
    }

    // Файлы и ссылки в текущей папке
    const items = currentFolder.items || [];
    console.log('📄 Файлов в текущей папке:', items.length);
    
    if (items.length > 0) {
        html += `<div><div style="font-size:12px;color:#7a8ba8;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Файлы и ссылки</div>`;
        items.forEach(item => {
            html += `<div style="background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:14px 16px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:14px;font-weight:500;color:#e8edf5;margin-bottom:4px;word-break:break-word;">${getFileIcon(item.type, item.fileType)} ${escapeHtml(item.name)}</div>
                        <div style="font-size:12px;color:#7a8ba8;margin-bottom:6px;">${item.type === 'link' ? '🔗 Ссылка' : '📄 Файл'} • ${item.addedDate}</div>
                        ${item.comment ? `<div style="font-size:13px;color:#aabbcc;margin-bottom:8px;font-style:italic;">${escapeHtml(item.comment)}</div>` : ''}
                        ${item.type === 'link' ? `<a href="${escapeHtml(item.url)}" target="_blank" style="color:#6a9aaa;text-decoration:none;font-size:13px;">Открыть ссылку →</a>` : ''}
                        ${item.type === 'file' && item.fileType === 'image' ? `<img src="${item.url}" style="max-width:200px;border-radius:8px;margin-top:8px;cursor:pointer;" onclick="window.viewImage('${item.url}')" />` : ''}
                        ${item.type === 'file' && item.fileType === 'audio' ? `<audio controls src="${item.url}" style="width:100%;max-width:400px;margin-top:8px;"></audio>` : ''}
                        ${item.type === 'file' && item.fileType === 'video' ? `<video controls src="${item.url}" style="max-width:100%;border-radius:8px;margin-top:8px;max-height:300px;"></video>` : ''}
                        ${item.type === 'file' && item.fileType === 'pdf' ? `<a href="${item.url}" target="_blank" style="color:#6a9aaa;text-decoration:none;font-size:13px;">Открыть PDF →</a>` : ''}
                    </div>
                    <button onclick="window.deleteItem('${item.id}')" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;margin-left:12px;flex-shrink:0;">Удалить</button>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    if (childFolders.length === 0 && items.length === 0) {
        html += `<div style="text-align:center;padding:40px;color:#7a8ba8;font-size:15px;">Пока пусто. Создай папку или добавь файл/ссылку.</div>`;
    }

    container.innerHTML = html;
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

// ========== ДЕЙСТВИЯ ==========
function switchSubject(subject) {
    console.log('🔄 switchSubject:', subject);
    currentSubject = subject;
    currentFolderId = null;
    renderStudies();
}

function openFolder(id) {
    console.log('📂 openFolder:', id);
    currentFolderId = id;
    renderStudies();
}

function goToRoot() {
    console.log('🏠 goToRoot');
    currentFolderId = null;
    renderStudies();
}

function createFolder() {
    const name = prompt('Название папки:');
    if (!name || !name.trim()) return;

    const parentFolder = getCurrentFolder();
    if (!parentFolder) {
        alert('Ошибка: не найдена текущая папка');
        return;
    }

    console.log('➕ createFolder:', name, 'в', parentFolder.name);

    studiesData.push({
        id: 'folder_' + Date.now(),
        name: name.trim(),
        subject: currentSubject,
        parentId: parentFolder.id,
        items: []
    });
    saveStudies();
    renderStudies();
}

function deleteFolderPrompt(id) {
    if (!confirm('Удалить папку и всё её содержимое?')) return;

    function collectIds(folderId) {
        const ids = [folderId];
        studiesData.filter(f => f.parentId === folderId).forEach(f => {
            ids.push(...collectIds(f.id));
        });
        return ids;
    }

    const idsToDelete = new Set(collectIds(id));
    studiesData = studiesData.filter(f => !idsToDelete.has(f.id));

    if (currentFolderId === id) currentFolderId = null;
    saveStudies();
    renderStudies();
}

async function addItem(type) {
    const targetFolder = getCurrentFolder();
    if (!targetFolder) {
        alert('Ошибка: не найдена текущая папка');
        return;
    }

    console.log('📥 addItem:', type, 'в', targetFolder.name, 'ID:', targetFolder.id);

    if (type === 'link') {
        const name = prompt('Название ссылки:');
        if (!name || !name.trim()) return;
        const url = prompt('URL ссылки:');
        if (!url || !url.trim()) return;
        const comment = prompt('Комментарий (необязательно):') || '';

        targetFolder.items = targetFolder.items || [];
        targetFolder.items.push({
            id: 'item_' + Date.now(),
            type: 'link',
            name: name.trim(),
            url: url.trim(),
            addedDate: new Date().toISOString().split('T')[0],
            comment: comment.trim()
        });

        // Если это корневая папка, сохраняем отдельно
        if (targetFolder.id === 'root_' + currentSubject) {
            saveRootItems(targetFolder.items);
        }
        
        saveStudies();
        renderStudies();

    } else if (type === 'file') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                const proceed = confirm(`⚠️ Файл большой (${(file.size / 1024 / 1024).toFixed(1)} MB). localStorage имеет лимит ~10MB. Загрузить всё равно?`);
                if (!proceed) return;
            }

            const name = prompt('Название (по умолчанию: ' + file.name + '):', file.name);
            if (!name || !name.trim()) return;
            const comment = prompt('Комментарий (необязательно):') || '';

            let fileType = 'other';
            if (file.type === 'application/pdf') fileType = 'pdf';
            else if (file.type.startsWith('audio/')) fileType = 'audio';
            else if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('image/')) fileType = 'image';

            const reader = new FileReader();
            reader.onload = async (event) => {
                targetFolder.items = targetFolder.items || [];
                targetFolder.items.push({
                    id: 'item_' + Date.now(),
                    type: 'file',
                    name: name.trim(),
                    url: event.target.result,
                    fileType: fileType,
                    addedDate: new Date().toISOString().split('T')[0],
                    comment: comment.trim()
                });

                // Если это корневая папка, сохраняем отдельно
                if (targetFolder.id === 'root_' + currentSubject) {
                    saveRootItems(targetFolder.items);
                }

                try {
                    saveStudies();
                    renderStudies();
                } catch (err) {
                    alert('❌ Не удалось сохранить: ' + err.message);
                    targetFolder.items.pop();
                }
            };
            reader.onerror = () => alert('❌ Ошибка чтения файла');
            reader.readAsDataURL(file);
        };
        input.click();
    }
}

function deleteItem(itemId) {
    if (!confirm('Удалить этот элемент?')) return;

    const targetFolder = getCurrentFolder();
    if (!targetFolder) return;

    targetFolder.items = (targetFolder.items || []).filter(item => item.id !== itemId);

    // Если это корневая папка, сохраняем отдельно
    if (targetFolder.id === 'root_' + currentSubject) {
        saveRootItems(targetFolder.items);
    }

    saveStudies();
    renderStudies();
}

// ========== ГЛОБАЛЬНЫЙ ЭКСПОРТ ==========
window.renderStudies = renderStudies;
window.switchSubject = switchSubject;
window.openFolder = openFolder;
window.goToRoot = goToRoot;
window.createFolder = createFolder;
window.deleteFolderPrompt = deleteFolderPrompt;
window.addItem = addItem;
window.deleteItem = deleteItem;
window.viewImage = viewImage;
window.loadStudies = loadStudies;
window.saveStudies = saveStudies;