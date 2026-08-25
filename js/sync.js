const SYNC_KEY = 'hronika_last_sync';

function collectAllData() {
    return {
        version: 2,
        lastSaved: new Date().toISOString(),
        challenges: JSON.parse(localStorage.getItem('hronika_challenges') || '[]'),
        studies: JSON.parse(localStorage.getItem('hronika_studies') || '[]'),
        photos: JSON.parse(localStorage.getItem('hronika_photos') || '[]'),
        books: JSON.parse(localStorage.getItem('hronika_books') || '[]'),
        movies: JSON.parse(localStorage.getItem('hronika_movies') || '[]')
    };
}

function distributeData(data) {
    if (data.challenges) localStorage.setItem('hronika_challenges', JSON.stringify(data.challenges));
    if (data.studies) localStorage.setItem('hronika_studies', JSON.stringify(data.studies));
    if (data.photos) localStorage.setItem('hronika_photos', JSON.stringify(data.photos));
    if (data.books) localStorage.setItem('hronika_books', JSON.stringify(data.books));
    if (data.movies) localStorage.setItem('hronika_movies', JSON.stringify(data.movies));
    if (data.lastSaved) localStorage.setItem(SYNC_KEY, data.lastSaved);
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function syncSaveToCloud() {
    const data = collectAllData();
    const fileName = `hronika-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    const fileContent = JSON.stringify(data, null, 2);

    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: 'JSON файл Хроники', accept: { 'application/json': ['.json'] } }]
            });
            const writable = await handle.createWritable();
            await writable.write(fileContent);
            await writable.close();
            localStorage.setItem(SYNC_KEY, data.lastSaved);
            showToast('✅ Сохранено! TeraBox синхронизирует файл');
            return;
        } catch (e) {
            if (e.name === 'AbortError') return;
            console.error('Ошибка сохранения:', e);
        }
    }

    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(SYNC_KEY, data.lastSaved);
    showToast('✅ Файл скачан! Перемести его в папку TeraBox');
}

function syncLoadFromCloud(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.version || !data.lastSaved) { alert('❌ Неверный формат файла'); return; }
            const localData = collectAllData();
            const localTime = new Date(localData.lastSaved || 0);
            const cloudTime = new Date(data.lastSaved);
            if (cloudTime <= localTime) {
                if (!confirm('⚠️ Файл СТАРЕЕ локальных данных. Всё равно заменить?')) return;
            } else {
                if (!confirm(`✅ Файл НОВЕЕ (сохранён ${formatDate(data.lastSaved)}). Заменить все данные?`)) return;
            }
            distributeData(data);
            showToast('✅ Все данные загружены!');
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderStudies === 'function') renderStudies();
            if (typeof renderGallery === 'function') renderGallery();
        } catch (err) { alert('❌ Ошибка: ' + err.message); }
    };
    reader.readAsText(file);
}

function checkSyncNeeded() {
    const lastSync = localStorage.getItem(SYNC_KEY);
    if (!lastSync) return true;
    const hoursDiff = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
    return hoursDiff > 2;
}

function showSyncMenu() {
    const existing = document.getElementById('syncMenu');
    if (existing) { existing.remove(); return; }
    
    const menu = document.createElement('div');
    menu.id = 'syncMenu';
    menu.style.cssText = 'position:fixed;top:70px;right:20px;background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:16px;z-index:1000;min-width:340px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
    
    const lastSync = localStorage.getItem(SYNC_KEY);
    const lastSyncText = lastSync ? `Последнее: ${formatDate(lastSync)}` : 'Ещё не сохранялось';
    
    menu.innerHTML = `
        <div style="font-size:13px;color:#7a8ba8;margin-bottom:12px;">${lastSyncText}</div>
        <button id="syncSaveBtn" style="width:100%;background:#2a6a4a;color:#e8edf5;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;margin-bottom:8px;">💾 Сохранить всё в TeraBox</button>
        <label style="display:block;width:100%;background:#2a4a6a;color:#e8edf5;border:none;border-radius:8px;padding:12px;font-size:14px;cursor:pointer;font-family:inherit;text-align:center;margin-bottom:8px;">
            📂 Загрузить всё из TeraBox
            <input type="file" id="syncLoadFile" accept=".json" style="display:none;" />
        </label>
        <div style="font-size:11px;color:#5a6a7a;margin-top:12px;line-height:1.5;background:#0b0e14;padding:10px;border-radius:8px;">
            <strong>⚠️ ВАЖНО:</strong><br>
            Когда откроется окно "Сохранить как" — <strong>перейди в папку TeraBox</strong> (например, C:\\Users\\Ты\\TeraBox\\) и сохрани туда.<br><br>
            TeraBox сам синхронизирует файл в облако.<br>
            На телефоне: скачай файл из TeraBox → нажми "Загрузить" → выбери файл.
        </div>
    `;
    
    document.body.appendChild(menu);
    
    document.getElementById('syncSaveBtn').addEventListener('click', () => {
        syncSaveToCloud();
        menu.remove();
    });
    
    document.getElementById('syncLoadFile').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            syncLoadFromCloud(e.target.files[0]);
            menu.remove();
        }
    });
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target.id !== 'syncBtn') {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

function showSyncReminder() {
    if (!checkSyncNeeded()) return;
    const reminder = document.createElement('div');
    reminder.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#2a6a4a;color:#e8edf5;padding:14px 20px;border-radius:12px;z-index:999;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-size:13px;cursor:pointer;max-width:320px;';
    reminder.innerHTML = '️ Данные не сохранены более 2 часов.<br><strong>Нажми, чтобы сохранить всё.</strong>';
    reminder.onclick = () => { showSyncMenu(); reminder.remove(); };
    document.body.appendChild(reminder);
    setTimeout(() => reminder.remove(), 10000);
}

window.showSyncMenu = showSyncMenu;
window.syncSaveToCloud = syncSaveToCloud;
window.syncLoadFromCloud = syncLoadFromCloud;
window.showSyncReminder = showSyncReminder;