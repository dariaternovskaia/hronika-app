// ========== СИСТЕМА СИНХРОНИЗАЦИИ ЧЕРЕЗ ОБЛАКО ==========

const SYNC_KEY = 'hronika_last_sync';
const SYNC_FILE_NAME = 'hronika-backup';

function collectAllData() {
    const data = {
        version: 1,
        lastSaved: new Date().toISOString(),
        challenges: JSON.parse(localStorage.getItem('hronika_challenges') || '[]'),
        studies: JSON.parse(localStorage.getItem('hronika_studies') || '[]'),
        photos: JSON.parse(localStorage.getItem('hronika_photos') || '[]')
    };
    return data;
}

function distributeData(data) {
    if (data.challenges) localStorage.setItem('hronika_challenges', JSON.stringify(data.challenges));
    if (data.studies) localStorage.setItem('hronika_studies', JSON.stringify(data.studies));
    if (data.photos) localStorage.setItem('hronika_photos', JSON.stringify(data.photos));
    if (data.lastSaved) localStorage.setItem(SYNC_KEY, data.lastSaved);
}

function syncSaveToCloud() {
    const data = collectAllData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${SYNC_FILE_NAME}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(SYNC_KEY, data.lastSaved);
    showToast('✅ Файл сохранён! Перемести его в облачную папку (Яндекс.Диск)');
}

function syncLoadFromCloud(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.version || !data.lastSaved) {
                alert('❌ Неверный формат файла');
                return;
            }
            const localData = collectAllData();
            const localTime = new Date(localData.lastSaved || 0);
            const cloudTime = new Date(data.lastSaved);
            if (cloudTime <= localTime) {
                if (!confirm('⚠️ Файл из облака СТАРЕЕ локальных данных. Всё равно заменить?')) return;
            } else {
                if (!confirm(`✅ Файл из облака НОВЕЕ (сохранён ${formatDate(data.lastSaved)}). Заменить локальные данные?`)) return;
            }
            distributeData(data);
            showToast('✅ Данные загружены из облака!');
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof renderStudies === 'function') renderStudies();
            if (typeof renderGallery === 'function') renderGallery();
        } catch (err) {
            alert('❌ Ошибка чтения файла: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function checkSyncNeeded() {
    const lastSync = localStorage.getItem(SYNC_KEY);
    if (!lastSync) return false;
    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const hoursDiff = (now - lastSyncTime) / (1000 * 60 * 60);
    return hoursDiff > 2;
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showSyncMenu() {
    const existing = document.getElementById('syncMenu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.id = 'syncMenu';
    menu.style.cssText = 'position:fixed;top:70px;right:20px;background:#141a24;border:1px solid #1f2838;border-radius:12px;padding:16px;z-index:1000;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
    const lastSync = localStorage.getItem(SYNC_KEY);
    const lastSyncText = lastSync ? `Последнее сохранение: ${formatDate(lastSync)}` : 'Ещё не сохранялось';
    menu.innerHTML = `
        <div style="font-size:13px;color:#7a8ba8;margin-bottom:12px;">${lastSyncText}</div>
        <button id="syncSaveBtn" style="width:100%;background:#2a4a6a;color:#e8edf5;border:none;border-radius:8px;padding:10px;font-size:13px;cursor:pointer;font-family:inherit;margin-bottom:8px;"> Сохранить в облако</button>
        <label style="display:block;width:100%;background:#1a2230;color:#e8edf5;border:1px solid #1f2838;border-radius:8px;padding:10px;font-size:13px;cursor:pointer;font-family:inherit;text-align:center;">
            📂 Загрузить из облака
            <input type="file" id="syncLoadFile" accept=".json" style="display:none;" />
        </label>
        <div style="font-size:11px;color:#5a6a7a;margin-top:12px;line-height:1.4;">
            💡 Как работает:<br>
            1. "Сохранить" — скачает файл<br>
            2. Перемести его в облачную папку (Яндекс.Диск)<br>
            3. На другом устройстве — "Загрузить" и выбери файл
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
    reminder.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#2a4a6a;color:#e8edf5;padding:12px 20px;border-radius:12px;z-index:999;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-size:13px;cursor:pointer;max-width:300px;';
    reminder.innerHTML = '️ Данные не синхронизированы более 2 часов. <strong>Нажми, чтобы сохранить в облако.</strong>';
    reminder.onclick = () => {
        showSyncMenu();
        reminder.remove();
    };
    document.body.appendChild(reminder);
    setTimeout(() => reminder.remove(), 10000);
}

window.showSyncMenu = showSyncMenu;
window.syncSaveToCloud = syncSaveToCloud;
window.syncLoadFromCloud = syncLoadFromCloud;