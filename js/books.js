// ============================================================
// ЧИТАТЕЛЬСКИЙ ДНЕВНИК
// ============================================================

function renderBooks() {
    const container = document.getElementById('booksDiary');
    if (APP.books.length === 0) {
        container.innerHTML = '<div class="text-muted" style="padding:20px;text-align:center;">Нет записей</div>';
        return;
    }
    let html = '';
    for (let i = 0; i < APP.books.length; i++) {
        const item = APP.books[i];
        html += `
            <div class="diary-item">
                <div class="diary-title">${item.title}</div>
                <div class="diary-meta">${item.author || ''} • ${item.date || ''} • Оценка: ${item.rating || '—'}</div>
                <div class="diary-review">${item.review || 'Без отзыва'}</div>
                <div class="diary-actions">
                    <button onclick="editBook(${i})">✎</button>
                    <button onclick="deleteBook(${i})">✕</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function addBook() {
    showModal('Добавить книгу', `
        <label>Дата</label>
        <input type="date" id="bookDate" value="${new Date().toISOString().slice(0,10)}">
        <label>Название</label>
        <input type="text" id="bookTitle" placeholder="Название книги">
        <label>Автор</label>
        <input type="text" id="bookAuthor" placeholder="Автор">
        <label>Оценка (1-10)</label>
        <input type="number" id="bookRating" min="1" max="10" placeholder="10">
        <label>Отзыв</label>
        <textarea id="bookReview" placeholder="Ваш отзыв..."></textarea>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmAddBook()">Добавить</button>
        </div>
    `);
}

function confirmAddBook() {
    const title = document.getElementById('bookTitle').value.trim();
    if (!title) return showToast('Введите название', 'error');
    APP.books.push({
        date: document.getElementById('bookDate').value || '',
        title: title,
        author: document.getElementById('bookAuthor').value.trim(),
        rating: document.getElementById('bookRating').value || '',
        review: document.getElementById('bookReview').value.trim()
    });
    saveAppState();
    renderBooks();
    closeModal();
    showToast('Книга добавлена');
}

function editBook(index) {
    const item = APP.books[index];
    if (!item) return;
    showModal('Редактировать книгу', `
        <label>Дата</label>
        <input type="date" id="editBookDate" value="${item.date || ''}">
        <label>Название</label>
        <input type="text" id="editBookTitle" value="${item.title || ''}">
        <label>Автор</label>
        <input type="text" id="editBookAuthor" value="${item.author || ''}">
        <label>Оценка (1-10)</label>
        <input type="number" id="editBookRating" min="1" max="10" value="${item.rating || ''}">
        <label>Отзыв</label>
        <textarea id="editBookReview">${item.review || ''}</textarea>
        <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="confirmEditBook(${index})">Сохранить</button>
        </div>
    `);
}

function confirmEditBook(index) {
    const title = document.getElementById('editBookTitle').value.trim();
    if (!title) return showToast('Введите название', 'error');
    APP.books[index] = {
        date: document.getElementById('editBookDate').value || '',
        title: title,
        author: document.getElementById('editBookAuthor').value.trim(),
        rating: document.getElementById('editBookRating').value || '',
        review: document.getElementById('editBookReview').value.trim()
    };
    saveAppState();
    renderBooks();
    closeModal();
    showToast('Книга обновлена');
}

function deleteBook(index) {
    if (!confirm('Удалить запись?')) return;
    APP.books.splice(index, 1);
    saveAppState();
    renderBooks();
    showToast('Запись удалена');
}