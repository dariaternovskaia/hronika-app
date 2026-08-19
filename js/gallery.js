// ========== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ==========
let galleryDB;
const GALLERY_DB_NAME = 'hronika_gallery';
const GALLERY_STORE = 'photos';

function initGalleryDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(GALLERY_DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { galleryDB = request.result; resolve(galleryDB); };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(GALLERY_STORE)) {
                db.createObjectStore(GALLERY_STORE, { keyPath: 'id' });
            }
        };
    });
}

async function getPhotos() {
    return new Promise((resolve, reject) => {
        const transaction = galleryDB.transaction([GALLERY_STORE], 'readonly');
        const store = transaction.objectStore(GALLERY_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function savePhoto(photo) {
    return new Promise((resolve, reject) => {
        const transaction = galleryDB.transaction([GALLERY_STORE], 'readwrite');
        const store = transaction.objectStore(GALLERY_STORE);
        const request = store.put(photo);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function deletePhoto(id) {
    return new Promise((resolve, reject) => {
        const transaction = galleryDB.transaction([GALLERY_STORE], 'readwrite');
        const store = transaction.objectStore(GALLERY_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========== ОТРИСОВКА ==========
async function renderGallery() {
    const container = document.getElementById('photoContent');
    if (!container) return;

    await initGalleryDB();
    let photos = await getPhotos();

    // Сортировка по дате фото (новые сверху)
    photos.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';

    // Кнопки управления
    html += `<div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">`;
    html += `<button onclick="addPhoto()" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;font-family:inherit;"> Добавить фото</button>`;
    html += `<button onclick="exportGallery()" style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">📥 Экспорт</button>`;
    html += `<label style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:12px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit;">
         Импорт
        <input type="file" id="importGalleryFile" accept=".json" style="display:none;" onchange="importGallery(this.files[0])" />
    </label>`;
    html += `</div>`;

    if (photos.length === 0) {
        html += `<div style="text-align:center;padding:40px;color:#7a8ba8;font-size:15px;">
             Пока нет фото. Нажми "📷 Добавить фото" чтобы загрузить первое.
        </div>`;
    } else {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">`;
        
        photos.forEach(photo => {
            html += `
                <div style="background:#141a24;border:1px solid #1f2838;border-radius:12px;overflow:hidden;">
                    <img src="${photo.data}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer;display:block;" onclick="viewPhoto('${photo.id}')" />
                    <div style="padding:12px;">
                        <div style="font-size:12px;color:#7a8ba8;margin-bottom:4px;">📅 ${photo.date}</div>
                        ${photo.comment ? `<div style="font-size:13px;color:#aabbcc;margin-bottom:8px;font-style:italic;">${photo.comment}</div>` : ''}
                        <div style="display:flex;gap:6px;">
                            <button onclick="editPhoto('${photo.id}')" style="background:#1a2230;color:#7a8ba8;border:1px solid #1f2838;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit;">✏️ Изменить</button>
                            <button onclick="deletePhotoPrompt('${photo.id}')" style="background:#3a1a1a;color:#e8edf5;border:none;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit;"> Удалить</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    }

    container.innerHTML = html;
}

// ========== ДЕЙСТВИЯ ==========
async function addPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const today = new Date().toISOString().split('T')[0];

        for (const file of files) {
            const date = prompt(`Дата фото "${file.name}" (по умолчанию: ${today}):`, today);
            if (date === null) continue; // отмена

            const comment = prompt(`Комментарий к "${file.name}" (необязательно):`) || '';

            const reader = new FileReader();
            reader.onload = async (event) => {
                const photo = {
                    id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    data: event.target.result,
                    date: date || today,
                    addedDate: today,
                    comment: comment
                };
                await savePhoto(photo);
                renderGallery();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

async function editPhoto(id) {
    const photos = await getPhotos();
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    const newDate = prompt('Новая дата (ГГГГ-ММ-ДД):', photo.date);
    if (newDate === null) return;

    const newComment = prompt('Новый комментарий:', photo.comment || '');
    if (newComment === null) return;

    photo.date = newDate;
    photo.comment = newComment;
    await savePhoto(photo);
    renderGallery();
}

async function deletePhotoPrompt(id) {
    if (!confirm('Удалить это фото?')) return;
    await deletePhoto(id);
    renderGallery();
}

async function viewPhoto(id) {
    const photos = await getPhotos();
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer;';
    modal.onclick = () => modal.remove();

    const img = document.createElement('img');
    img.src = photo.data;
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;';

    const info = document.createElement('div');
    info.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);padding:10px 20px;border-radius:12px;color:#e8edf5;font-size:13px;text-align:center;max-width:80%;';
    info.innerHTML = `📅 ${photo.date}${photo.comment ? '<br>' + photo.comment : ''}`;

    modal.appendChild(img);
    modal.appendChild(info);
    document.body.appendChild(modal);
}

// ========== ЭКСПОРТ/ИМПОРТ ==========
async function exportGallery() {
    const photos = await getPhotos();
    const dataStr = JSON.stringify(photos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hronika-gallery-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Файл сохранён! Загрузи его в TeraBox.');
}

async function importGallery(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                alert('❌ Неверный формат файла');
                return;
            }
            if (confirm(`Импортировать ${imported.length} фото? Текущие данные будут заменены.`)) {
                const photos = await getPhotos();
                for (const photo of photos) await deletePhoto(photo.id);
                for (const photo of imported) await savePhoto(photo);
                renderGallery();
                alert('✅ Импорт завершён!');
            }
        } catch (err) {
            alert('❌ Ошибка: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Делаем функции глобальными
window.renderGallery = renderGallery;
window.addPhoto = addPhoto;
window.editPhoto = editPhoto;
window.deletePhotoPrompt = deletePhotoPrompt;
window.viewPhoto = viewPhoto;
window.exportGallery = exportGallery;
window.importGallery = importGallery;