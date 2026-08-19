// ========== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ==========
let db;
const DB_NAME = 'hronika_studies';
const STORE_NAME = 'folders';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

async function getFolders() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveFolder(folder) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(folder);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function deleteFolder(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========== ДАННЫЕ ==========
const subjects = {
    math: 'Математика',
    philosophy: 'Философия',
    linguistics: 'Языкознание'
};

let currentSubject = 'math';
let currentFolderId = null;

// ========== ОТРИСОВКА ==========
async function renderStudies() {
    const container = document.getElementById('studyContent');
    if (!container) return;

    await initDB();
    const folders = await getFolders();

    let html = '';

    // Навигация по предметам
    html += `<div class="studies-nav" style="margin-bottom: 20px;">`;
    Object.keys(subjects).forEach(key => {
        html += `<button class="${currentSubject === key ? 'active' : ''}" onclick="switchSubject('${key}')">${subjects[key]}</button>`;
    });
    html += `</div>`;

    // Кнопки управления
    html += `<div style="margin-bottom: 20px; display: flex; gap: 8px; flex-wrap: wrap;">`;
    if (currentFolderId) {
        html += `<button onclick="goBack()" style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;">← Назад</button>`;
    }
    html += `<button onclick="createFolder()" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;">+ Новая папка</button>`;
    html += `<button onclick="addItem()" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;">+ Добавить файл/ссылку</button>`;
    html += `<button onclick="exportStudies()" style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;">📥 Экспорт</button>`;
    html += `<label style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;">
         Импорт
        <input type="file" id="importStudiesFile" accept=".json" style="display:none;" onchange="importStudies(this.files[0])" />
    </label>`;
    html += `</div>`;

    // Заголовок текущей папки
    if (currentFolderId) {
        const currentFolder = folders.find(f => f.id === currentFolderId);
        if (currentFolder) {
            html += `<h3 style="margin-bottom: 16px; color: #e8edf5;">📁 ${currentFolder.name}</h3>`;
        }
    }

    // Отображение папок и файлов
    const subjectFolders = folders.filter(f => f.subject === currentSubject && f.parentId === currentFolderId);
    
    if (subjectFolders.length === 0 && !currentFolderId) {
        html += `<div style="text-align:center;padding:40px;color:#7a8ba8;font-size:16px;">
             Пока нет папок. Нажми "+ Новая папка" чтобы создать первую.
        </div>`;
    } else {
        // Папки
        subjectFolders.forEach(folder => {
            const itemCount = folder.items ? folder.items.length : 0;
            html += `
                <div style="background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
                    <div style="cursor:pointer;flex:1;" onclick="openFolder('${folder.id}')">
                        <div style="font-size:16px;font-weight:500;color:#e8edf5;margin-bottom:4px;">📁 ${folder.name}</div>
                        <div style="font-size:12px;color:#7a8ba8;">${itemCount} элементов</div>
                    </div>
                    <button onclick="deleteFolderPrompt('${folder.id}')" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;">Удалить</button>
                </div>
            `;
        });

        // Файлы в текущей папке
        if (currentFolderId) {
            const currentFolder = folders.find(f => f.id === currentFolderId);
            if (currentFolder && currentFolder.items) {
                currentFolder.items.forEach(item => {
                    html += `
                        <div style="background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:16px;margin-bottom:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                <div style="flex:1;">
                                    <div style="font-size:14px;font-weight:500;color:#e8edf5;margin-bottom:4px;">
                                        ${getFileIcon(item.type, item.fileType)} ${item.name}
                                    </div>
                                    <div style="font-size:12px;color:#7a8ba8;margin-bottom:8px;">
                                        ${item.type === 'link' ? '🔗 Ссылка' : '📄 Файл'} • Добавлено: ${item.addedDate}
                                    </div>
                                    ${item.comment ? `<div style="font-size:13px;color:#aabbcc;margin-bottom:8px;">${item.comment}</div>` : ''}
                                    ${item.type === 'link' ? `<a href="${item.url}" target="_blank" style="color:#6a9aaa;text-decoration:none;font-size:13px;">Открыть ссылку →</a>` : ''}
                                    ${item.type === 'file' && item.fileType === 'image' ? `<img src="${item.url}" style="max-width:100%;border-radius:8px;margin-top:8px;" />` : ''}
                                    ${item.type === 'file' && item.fileType === 'audio' ? `<audio controls src="${item.url}" style="width:100%;margin-top:8px;"></audio>` : ''}
                                    ${item.type === 'file' && item.fileType === 'video' ? `<video controls src="${item.url}" style="max-width:100%;border-radius:8px;margin-top:8px;"></video>` : ''}
                                    ${item.type === 'file' && item.fileType === 'pdf' ? `<a href="${item.url}" download style="color:#6a9aaa;text-decoration:none;font-size:13px;">Скачать PDF →</a>` : ''}
                                </div>
                                <button onclick="deleteItem('${item.id}')" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;margin-left:12px;">Удалить</button>
                            </div>
                        </div>
                    `;
                });
            }
        }
    }

    container.innerHTML = html;
}

function getFileIcon(type, fileType) {
    if (type === 'link') return '';
    const icons = {
        pdf: '📕',
        audio: '🎵',
        video: '🎬',
        image: '️',
        other: '📄'
    };
    return icons[fileType] || '📄';
}

// ========== ДЕЙСТВИЯ ==========
function switchSubject(subject) {
    currentSubject = subject;
    currentFolderId = null;
    renderStudies();
}

function openFolder(id) {
    currentFolderId = id;
    renderStudies();
}

function goBack() {
    currentFolderId = null;
    renderStudies();
}

async function createFolder() {
    const name = prompt('Название папки:');
    if (!name || !name.trim()) return;

    const folders = await getFolders();
    const newFolder = {
        id: 'folder_' + Date.now(),
        name: name.trim(),
        subject: currentSubject,
        parentId: currentFolderId,
        items: []
    };

    await saveFolder(newFolder);
    renderStudies();
}

async function deleteFolderPrompt(id) {
    if (!confirm('Удалить папку и все её содержимое?')) return;
    await deleteFolder(id);
    renderStudies();
}

async function addItem() {
    if (!currentFolderId) {
        alert('Сначала создай или открой папку');
        return;
    }

    const type = prompt('Что добавляем? (1 - файл, 2 - ссылка):');
    if (!type) return;

    if (type === '2') {
        const name = prompt('Название:');
        if (!name) return;
        const url = prompt('URL ссылки:');
        if (!url) return;
        const comment = prompt('Комментарий (необязательно):') || '';

        const folders = await getFolders();
        const folder = folders.find(f => f.id === currentFolderId);
        if (!folder) return;

        folder.items = folder.items || [];
        folder.items.push({
            id: 'item_' + Date.now(),
            type: 'link',
            name: name.trim(),
            url: url.trim(),
            addedDate: new Date().toISOString().split('T')[0],
            comment: comment.trim()
        });

        await saveFolder(folder);
        renderStudies();
    } else if (type === '1') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const name = prompt('Название (по умолчанию: ' + file.name + '):', file.name);
            if (!name) return;

            const comment = prompt('Комментарий (необязательно):') || '';

            // Определяем тип файла
            let fileType = 'other';
            if (file.type === 'application/pdf') fileType = 'pdf';
            else if (file.type.startsWith('audio/')) fileType = 'audio';
            else if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('image/')) fileType = 'image';

            // Конвертируем в base64
            const reader = new FileReader();
            reader.onload = async (event) => {
                const folders = await getFolders();
                const folder = folders.find(f => f.id === currentFolderId);
                if (!folder) return;

                folder.items = folder.items || [];
                folder.items.push({
                    id: 'item_' + Date.now(),
                    type: 'file',
                    name: name.trim(),
                    url: event.target.result,
                    fileType: fileType,
                    addedDate: new Date().toISOString().split('T')[0],
                    comment: comment.trim()
                });

                await saveFolder(folder);
                renderStudies();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
}

async function deleteItem(itemId) {
    if (!confirm('Удалить этот элемент?')) return;

    const folders = await getFolders();
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;

    folder.items = folder.items.filter(item => item.id !== itemId);
    await saveFolder(folder);
    renderStudies();
}

// ========== ЭКСПОРТ/ИМПОРТ ==========
async function exportStudies() {
    const folders = await getFolders();
    const dataStr = JSON.stringify(folders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hronika-studies-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Файл сохранён! Загрузи его в TeraBox.');
}

async function importStudies(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                alert('❌ Неверный формат файла');
                return;
            }
            if (confirm(`Импортировать ${imported.length} папок? Текущие данные будут заменены.`)) {
                // Удаляем старые данные
                const folders = await getFolders();
                for (const folder of folders) {
                    await deleteFolder(folder.id);
                }
                // Добавляем новые
                for (const folder of imported) {
                    await saveFolder(folder);
                }
                renderStudies();
                alert('✅ Импорт завершён!');
            }
        } catch (err) {
            alert('❌ Ошибка чтения файла: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Запуск
document.addEventListener('DOMContentLoaded', renderStudies);