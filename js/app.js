// ============================================================
// ГЛАВНЫЙ КОД ПРИЛОЖЕНИЯ
// ============================================================

const STORAGE_KEY = 'hronika_data';
let APP = {
    token: null,
    login: '',
    password: '',
    challenges: [],
    events: [],
    studies: {
        matematika: { files: [], links: [] },
        filosofiya: { files: [], links: [] },
        yazyki: { files: [], links: [] }
    },
    books: [],
    movies: [],
    dayData: {}
};

function loadAppState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(APP, parsed);
            return true;
        }
    } catch (e) {}
    return false;
}

function saveAppState() {
    try {
        const toSave = {
            token: APP.token,
            login: APP.login,
            password: APP.password,
            challenges: APP.challenges,
            events: APP.events,
            studies: APP.studies,
            books: APP.books,
            movies: APP.movies,
            dayData: APP.dayData
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {}
}

function showToast(msg, type = 'info') {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const div = document.createElement('div');
    div.className = 'toast' + (type === 'error' ? ' error' : '');
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

function showModal(title, content) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modalContent');
    modal.innerHTML = `<h3>${title}</h3>${content}`;
    overlay.classList.add('open');
    setTimeout(() => {
        const inp = modal.querySelector('input, textarea, select');
        if (inp) inp.focus();
    }, 100);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}

document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen' + screenId.charAt(0).toUpperCase() + screenId.slice(1));
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav button[data-screen]').forEach(b => {
        b.classList.toggle('active', b.dataset.screen === screenId);
    });

    if (screenId === 'calendar') renderCalendar();
    if (screenId === 'studies') renderStudies();
    if (screenId === 'gallery') renderGallery();
    if (screenId === 'books') renderBooks();
    if (screenId === 'movies') renderMovies();
}

// Инициализация
async function initApp() {
    loadAppState();

    if (APP.token) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        renderCalendar();
        renderStudies();
        renderGallery();
        renderBooks();
        renderMovies();
        showToast('Добро пожаловать!');
        return;
    }

    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';

    document.getElementById('loginBtn').addEventListener('click', async function() {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value.trim();
        const errorEl = document.getElementById('loginError');

        if (!email || !pass) {
            errorEl.textContent = 'Введите email и пароль';
            return;
        }

        try {
            errorEl.textContent = 'Вход...';
            const result = await teraboxLogin(email, pass);
            if (result.success) {
                errorEl.textContent = '';
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('appScreen').style.display = 'block';
                renderCalendar();
                renderStudies();
                renderGallery();
                renderBooks();
                renderMovies();
                showToast('Вход выполнен!');
            }
        } catch (e) {
            errorEl.textContent = e.error || 'Ошибка входа. Проверьте данные.';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initApp();

    document.querySelectorAll('.nav button[data-screen]').forEach(btn => {
        btn.addEventListener('click', function() {
            const screen = this.dataset.screen;
            if (screen === 'logout') {
                if (confirm('Выйти из аккаунта?')) {
                    APP.token = null;
                    APP.login = '';
                    APP.password = '';
                    saveAppState();
                    location.reload();
                }
                return;
            }
            showScreen(screen);
        });
    });

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

    document.getElementById('addBookBtn').addEventListener('click', addBook);
    document.getElementById('addMovieBtn').addEventListener('click', addMovie);
});