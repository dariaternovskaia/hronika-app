// ============================================================
// ГАЛЕРЕЯ ФОТО
// ============================================================

async function renderGallery() {
    const container = document.getElementById('galleryGrid');
    const path = 'Хроника/Фото';
    const files = await teraboxListFiles(path);
    
    if (files.length === 0) {
        container.innerHTML = '<div class="text-muted" style="grid-column:span 3;text-align:center;padding:40px 0;">Нет фото. Добавьте первое!</div>';
        return;
    }
    
    let html = '';
    for (let f of files) {
        html += `
            <div class="gallery-item" onclick="openPhoto('${f.name}')">
                <span>[Фото]</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

function openPhoto(name) {
    showToast('Фото: ' + name);
}