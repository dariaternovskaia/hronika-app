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
                <div class="placeholder">[Фото]</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function openPhoto(name) {
    showToast('Фото: ' + name);
}

document.getElementById('addPhotoBtn').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async function(e) {
        const files = e.target.files;
        if (!files.length) return;
        const path = 'Хроника/Фото';
        await teraboxCreateFolder(path);
        for (let file of files) {
            const dateStr = new Date().toISOString().slice(0,10);
            const newName = `${dateStr}_${file.name}`;
            const renamed = new File([file], newName, { type: file.type });
            await teraboxUploadFile(path, renamed, { source: 'gallery' });
        }
        showToast('Фото загружены');
        renderGallery();
    };
    input.click();
});