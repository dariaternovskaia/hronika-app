function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen' + screenId.charAt(0).toUpperCase() + screenId.slice(1));
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav button[data-screen]').forEach(b => {
        b.classList.toggle('active', b.dataset.screen === screenId);
    });

    if (screenId === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
    if (screenId === 'studies' && typeof renderStudies === 'function') renderStudies();
    if (screenId === 'gallery' && typeof renderGallery === 'function') renderGallery();
    if (screenId === 'books' && typeof renderBooks === 'function') renderBooks();
    if (screenId === 'movies' && typeof renderMovies === 'function') renderMovies();
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav button[data-screen]').forEach(btn => {
        btn.addEventListener('click', function() {
            const screen = this.dataset.screen;
            if (screen === 'logout') {
                if (confirm('Выйти из аккаунта?')) location.reload();
                return;
            }
            showScreen(screen);
        });
    });

    showScreen('calendar');
});