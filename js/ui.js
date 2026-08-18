// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И UI
// ============================================================

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    if (screenId === 'year') renderYearCalendar();
    if (screenId === 'gallery') renderGallery();
    if (screenId === 'challenges') renderChallenges();
}