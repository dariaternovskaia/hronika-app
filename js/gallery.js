let photosData = [];

async function loadPhotos() {
    const data = localStorage.getItem('hronika_photos');
    photosData = data ? JSON.parse(data) : [];
}

async function savePhotos() {
    localStorage.setItem('hronika_photos', JSON.stringify(photosData));
}

async function renderGallery() {
    const container = document.getElementById('photoContent');
    if (!container) return;
    await loadPhotos();
    photosData.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    html += `<div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">`;
    html += `<button onclick="addPhoto()" style="background:#2a4a6a;color:#e8edf5;border:none;border-radius:12px;padding:10px 20px;font-size:14px;cursor:pointer;font-family:inherit;">+ Добавить фото</button>`;
    html += `</div>`;

    if (photosData.length === 0) {
        html += `<div style="text-align:center;padding:40px;color:#7a8ba8;font-size:15px;">📷 Пока нет фото. Нажми "+ Добавить фото" чтобы загрузить первое.</div>`;
    } else {
        html += `<div class="photo-gallery-grid">`;
        photosData.forEach(photo => {
            html += `<div class="photo-card">
                <div class="photo-wrapper" onclick="viewPhoto('${photo.id}')"><img src="${photo.data}" class="photo-thumb" /></div>
                <div class="photo-info">
                    <div class="photo-date">📅 ${photo.date}</div>
                    ${photo.comment ? `<div class="photo-comment">${photo.comment}</div>` : ''}
                    <div class="photo-actions">
                        <button onclick="editPhoto('${photo.id}')" class="btn-edit">✏️ Изменить</button>
                        <button onclick="deletePhotoPrompt('${photo.id}')" class="btn-delete"> Удалить</button>
                    </div>
                </div>
            </div>`;
        });
        html += `</div>`;
    }
    container.innerHTML = html;
}

async function addPhoto() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const today = new Date().toISOString().split('T')[0];
        for (const file of files) {
            const date = prompt(`Дата фото "${file.name}" (по умолчанию: ${today}):`, today);
            if (date === null) continue;
            const comment = prompt(`Комментарий к "${file.name}" (необязательно):`) || '';
            const reader = new FileReader();
            reader.onload = async (event) => {
                photosData.push({
                    id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    data: event.target.result, date: date || today, addedDate: today, comment: comment
                });
                await savePhotos();
                renderGallery();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

async function editPhoto(id) {
    const photo = photosData.find(p => p.id === id);
    if (!photo) return;
    const newDate = prompt('Новая дата (ГГГГ-ММ-ДД):', photo.date);
    if (newDate === null) return;
    const newComment = prompt('Новый комментарий:', photo.comment || '');
    if (newComment === null) return;
    photo.date = newDate; photo.comment = newComment;
    await savePhotos(); renderGallery();
}

async function deletePhotoPrompt(id) {
    if (!confirm('Удалить это фото?')) return;
    photosData = photosData.filter(p => p.id !== id);
    await savePhotos(); renderGallery();
}

async function viewPhoto(id) {
    const photo = photosData.find(p => p.id === id);
    if (!photo) return;
    const modal = document.createElement('div');
    modal.className = 'photo-viewer-modal';
    modal.onclick = () => modal.remove();
    const img = document.createElement('img');
    img.src = photo.data; img.className = 'photo-viewer-img';
    const info = document.createElement('div');
    info.className = 'photo-viewer-info';
    info.innerHTML = `📅 ${photo.date}${photo.comment ? '<br>' + photo.comment : ''}`;
    modal.appendChild(img); modal.appendChild(info);
    document.body.appendChild(modal);
}

window.renderGallery = renderGallery;
window.addPhoto = addPhoto;
window.editPhoto = editPhoto;
window.deletePhotoPrompt = deletePhotoPrompt;
window.viewPhoto = viewPhoto;