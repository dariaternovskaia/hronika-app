// ========== ДАННЫЕ ЧЕЛЛЕНДЖЕЙ ==========
let challenges = JSON.parse(localStorage.getItem('challenges') || '[]');

if (challenges.length === 0) {
    challenges = [
        {
            id: 'ch1',
            name: 'Английский каждый день',
            comment: '30 минут чтения + 10 новых слов',
            startDate: { day: 3, month: 0, year: 2026 },
            endDate: { day: 25, month: 0, year: 2026 },
            pace: { unit: 'lessons', customUnit: '', total: 30, perSession: 1, frequency: 'daily' },
            topic: 'linguistics',
            type: 'courses',
            color: '#fde68a'
        },
        {
            id: 'ch2',
            name: 'Утренняя зарядка',
            comment: '15 минут растяжки',
            startDate: { day: 10, month: 0, year: 2026 },
            endDate: { day: 28, month: 0, year: 2026 },
            pace: { unit: 'tasks', customUnit: '', total: 20, perSession: 1, frequency: 'daily' },
            topic: 'other',
            type: 'other',
            color: '#bbf7d0'
        }
    ];
    localStorage.setItem('challenges', JSON.stringify(challenges));
}

const year = 2026;
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function daysInMonth(m, y) {
    return new Date(y, m + 1, 0).getDate();
}

function renderCalendar() {
    const container = document.getElementById('calendar');
    if (!container) return;

    let html = '';

    for (let m = 0; m < 12; m++) {
        const totalDays = daysInMonth(m, year);

        html += `<div class="month-row" data-month="${m}">`;
        
        // Левая колонка — месяц
        html += `<div class="month-label">${monthNames[m]}<span class="year">${year}</span></div>`;

        // Правая часть
        html += `<div class="days-container">`;
        
        // Сетка дней (горизонтально)
        html += `<div class="days-grid">`;
        for (let d = 1; d <= totalDays; d++) {
            const dateObj = new Date(year, m, d);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const today = new Date();
            const isToday = (today.getFullYear() === year && today.getMonth() === m && today.getDate() === d);
            
            let cls = 'day-cell';
            if (isWeekend) cls += ' weekend';
            if (isToday) cls += ' today';
            
            html += `<div class="${cls}">${d}</div>`;
        }
        html += `</div>`;

        // Полоски челленджей (ПОД днями, не перекрывают)
        html += `<div class="challenge-bars" id="bars-${m}"></div>`;
        
        html += `</div></div>`;
    }

    container.innerHTML = html;
    renderChallengeBars();
}

function renderChallengeBars() {
    for (let m = 0; m < 12; m++) {
        const container = document.getElementById(`bars-${m}`);
        if (!container) continue;
        
        container.innerHTML = '';
        const totalDays = daysInMonth(m, year);
        
        challenges.forEach(ch => {
            const sM = ch.startDate.month;
            const eM = ch.endDate ? ch.endDate.month : 11;
            
            if (m < sM || m > eM) return;
            
            let sDay = (m === sM) ? ch.startDate.day : 1;
            let eDay = (m === eM) ? (ch.endDate ? ch.endDate.day : totalDays) : totalDays;
            
            const bar = document.createElement('div');
            bar.className = 'challenge-bar';
            bar.style.backgroundColor = ch.color || '#cbd5e1';
            bar.textContent = ch.name;
            bar.onclick = () => editChallenge(ch.id);
            
            const startPercent = ((sDay - 1) / totalDays) * 100;
            const widthPercent = ((eDay - sDay + 1) / totalDays) * 100;
            
            bar.style.marginLeft = startPercent + '%';
            bar.style.width = widthPercent + '%';
            
            container.appendChild(bar);
        });
    }
}

function editChallenge(id) {
    const ch = challenges.find(c => c.id === id);
    if (!ch) return;
    
    const newName = prompt('Название челленджа:', ch.name);
    if (newName === null) return;
    if (!newName.trim()) {
        alert('Введите название');
        return;
    }
    
    ch.name = newName.trim();
    localStorage.setItem('challenges', JSON.stringify(challenges));
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', renderCalendar);