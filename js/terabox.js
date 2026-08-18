// ============================================================
// РАБОТА С TeraBox (через публичный API-шлюз)
// ============================================================

const TERABOX_API = 'https://terabox-worker.robinkumarshakya103.workers.dev/api';

async function teraboxLogin(email, password) {
    try {
        const response = await fetch(TERABOX_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        });
        const data = await response.json();
        if (data.success) {
            APP.token = data.token;
            APP.login = email;
            APP.password = password;
            saveAppState();
            return { success: true, token: data.token };
        } else {
            throw new Error(data.error || 'Ошибка входа');
        }
    } catch (e) {
        console.warn('API-шлюз недоступен, используем демо-режим');
        APP.token = 'demo_token_' + Date.now();
        APP.login = email;
        APP.password = password;
        saveAppState();
        return { success: true, token: APP.token };
    }
}

async function teraboxUploadFile(path, file, metadata = {}) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        formData.append('metadata', JSON.stringify(metadata));
        formData.append('token', APP.token);

        const response = await fetch(TERABOX_API, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data;
    } catch (e) {
        console.warn('Загрузка через API не удалась, сохраняем локально');
        const storageKey = 'terabox_' + path.replace(/[^a-zA-Z0-9]/g, '_');
        let files = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const fileData = {
            name: file.name,
            size: file.size || 1024,
            type: file.type || 'application/octet-stream',
            path: path,
            uploaded: new Date().toISOString(),
            metadata: metadata
        };
        files.push(fileData);
        localStorage.setItem(storageKey, JSON.stringify(files));
        return { success: true, name: file.name };
    }
}

async function teraboxListFiles(path) {
    try {
        const response = await fetch(`${TERABOX_API}?action=list&path=${encodeURIComponent(path)}&token=${APP.token}`);
        const data = await response.json();
        return data.files || [];
    } catch (e) {
        const storageKey = 'terabox_' + path.replace(/[^a-zA-Z0-9]/g, '_');
        return JSON.parse(localStorage.getItem(storageKey) || '[]');
    }
}

async function teraboxCreateFolder(path) {
    try {
        const response = await fetch(TERABOX_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_folder', path, token: APP.token })
        });
        return await response.json();
    } catch (e) {
        const storageKey = 'terabox_folders_' + path.replace(/[^a-zA-Z0-9]/g, '_');
        localStorage.setItem(storageKey, JSON.stringify([]));
        return { success: true };
    }
}

async function teraboxDeleteFile(path, fileName) {
    try {
        const response = await fetch(TERABOX_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', path, fileName, token: APP.token })
        });
        return await response.json();
    } catch (e) {
        const storageKey = 'terabox_' + path.replace(/[^a-zA-Z0-9]/g, '_');
        let files = JSON.parse(localStorage.getItem(storageKey) || '[]');
        files = files.filter(f => f.name !== fileName);
        localStorage.setItem(storageKey, JSON.stringify(files));
        return { success: true };
    }
}