// ============================================================
// КИНОДНЕВНИК
// ============================================================

function renderMovies() {
    const container = document.getElementById('moviesDiary');
    if (APP.movies.length === 0) {
        container.innerHTML = '<div class="text-muted" style="padding:20px;text-align:center;">Нет записей</div>';
        return;
    }
    let html = '';
    for (let i = 0; i < APP.movies.length; i++) {
        const item = APP.movies[i];
        html += `
            <div class="diary-item">
                <div class="diary-title">${item.title}</div>
                <div class="diary-meta">${item.director || ''} • ${item.year || ''} • Оценка: ${item.rating || '—'}</div>
                <div class="diary-review">${item.review || 'Без отзыва'}</div>
                <div class="diary-actions">
                    <button onclick="editMovie(${i})">✎</button>
                    <button onclick="deleteMovie(${i})">✕</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function addMovie() {
    showModal('Добавить фильм', `
        <label>Дата просмотра</label>
        <input type="date" id="movieDate" value="${new Date().toISOString().slice(0,10)}">
        <label>Название</label>
        <input type="text" id="movieTitle" placeholder="Название фильма">
        <label>Режиссёр</label>
        <input type="text" id="movieDirector" placeholder="Режиссёр">
        <label>Год</label>
        <input type="text" id="movieYear" placeholder="Год выпуска">
        <label>Оценка (1-10)</label>
        <input type="number" id="movieRating" min="1" max="10" placeholder="10">
        <label>Отзыв</label>
        <textarea id="movieReview" placeholder="Ваш отзыв..."></textarea>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddMovie()">Добавить</button>
        </div>
    `);
}

function confirmAddMovie() {
    const title = document.getElementById('movieTitle').value.trim();
    if (!title) return showToast('Введите название', 'error');
    APP.movies.push({
        date: document.getElementById('movieDate').value || '',
        title: title,
        director: document.getElementById('movieDirector').value.trim(),
        year: document.getElementById('movieYear').value.trim(),
        rating: document.getElementById('movieRating').value || '',
        review: document.getElementById('movieReview').value.trim()
    });
    saveAppState();
    renderMovies();
    closeModal();
    showToast('Фильм добавлен');
}

function editMovie(index) {
    const item = APP.movies[index];
    if (!item) return;
    showModal('Редактировать фильм', `
        <label>Дата просмотра</label>
        <input type="date" id="editMovieDate" value="${item.date || ''}">
        <label>Название</label>
        <input type="text" id="editMovieTitle" value="${item.title || ''}">
        <label>Режиссёр</label>
        <input type="text" id="editMovieDirector" value="${item.director || ''}">
        <label>Год</label>
        <input type="text" id="editMovieYear" value="${item.year || ''}">
        <label>Оценка (1-10)</label>
        <input type="number" id="editMovieRating" min="1" max="10" value="${item.rating || ''}">
        <label>Отзыв</label>
        <textarea id="editMovieReview">${item.review || ''}</textarea>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmEditMovie(${index})">Сохранить</button>
        </div>
    `);
}

function confirmEditMovie(index) {
    const title = document.getElementById('editMovieTitle').value.trim();
    if (!title) return showToast('Введите название', 'error');
    APP.movies[index] = {
        date: document.getElementById('editMovieDate').value || '',
        title: title,
        director: document.getElementById('editMovieDirector').value.trim(),
        year: document.getElementById('editMovieYear').value.trim(),
        rating: document.getElementById('editMovieRating').value || '',
        review: document.getElementById('editMovieReview').value.trim()
    };
    saveAppState();
    renderMovies();
    closeModal();
    showToast('Фильм обновлён');
}

function deleteMovie(index) {
    if (!confirm('Удалить запись?')) return;
    APP.movies.splice(index, 1);
    saveAppState();
    renderMovies();
    showToast('Запись удалена');
}