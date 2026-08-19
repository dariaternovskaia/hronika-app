// ============================================================
// calendar.js — только календарь + полосы (не трогает другие разделы)
// ============================================================

(function() {
    'use strict';

    // ---------- данные челленджей ----------
    const challenges = [
        {
            id: 'ch1',
            name: 'Английский каждый день',
            description: '30 минут чтения + 10 новых слов',
            start: { day: 3, month: 0, year: 2026 },
            end:   { day: 25, month: 0, year: 2026 },
            color: '#fde68a',
            icon: '🇬🇧'
        },
        {
            id: 'ch2',
            name: 'Утренняя зарядка',
            description: '15 минут растяжки',
            start: { day: 10, month: 0, year: 2026 },
            end:   { day: 28, month: 0, year: 2026 },
            color: '#bbf7d0',
            icon: '💪'
        },
        {
            id: 'ch3',
            name: 'Медитация',
            description: '10 минут осознанности',
            start: { day: 1, month: 1, year: 2026 },
            end:   { day: 20, month: 1, year: 2026 },
            color: '#c7d2fe',
            icon: '🧘'
        },
        {
            id: 'ch4',
            name: 'Чтение книг',
            description: '30 страниц в день',
            start: { day: 5, month: 1, year: 2026 },
            end:   { day: 26, month: 1, year: 2026 },
            color: '#fecaca',
            icon: '📚'
        },
        {
            id: 'ch5',
            name: 'Прогулка 10k шагов',
            description: 'Ежедневная прогулка',
            start: { day: 8, month: 2, year: 2026 },
            end:   { day: 30, month: 2, year: 2026 },
            color: '#fed7aa',
            icon: '🚶'
        },
        {
            id: 'ch6',
            name: 'Испанский с нуля',
            description: 'Duolingo + произношение',
            start: { day: 1, month: 3, year: 2026 },
            end:   { day: 18, month: 3, year: 2026 },
            color: '#bae6fd',
            icon: '🇪🇸'
        }
    ];

    // ---------- вспомогательное ----------
    function daysInMonth(m, y) {
        return new Date(y, m + 1, 0).getDate();
    }

    function getFirstDayOfMonth(m, y) {
        return new Date(y, m, 1).getDay();
    }

    const year = 2026;
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    // ---------- главная функция отрисовки ----------
    function renderCalendar() {
        const container = document.getElementById('calendar');
        if (!container) return;

        let html = '';

        for (let m = 0; m < 12; m++) {
            const totalDays = daysInMonth(m, year);
            const firstDay = getFirstDayOfMonth(m, year);

            html += `<div class="month-row" data-month="${m}" data-year="${year}">`;
            html += `<div class="month-label">${monthNames[m]} <span class="year">${year}</span></div>`;
            html += `<div class="days-wrapper" style="position:relative; padding: 8px 6px 8px 10px;">`;

            // ---- сетка дней ----
            html += `<div class="days-grid" id="daysGrid_${m}" style="display:grid; grid-template-columns: repeat(31, 34px); gap:2px; position:relative; min-height:64px;">`;
            for (let d = 1; d <= totalDays; d++) {
                const dateObj = new Date(year, m, d);
                const dayOfWeek = dateObj.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                const today = new Date();
                const isToday = (today.getFullYear() === year && today.getMonth() === m && today.getDate() === d);
                let cls = 'day-cell';
                if (isWeekend) cls += ' weekend';
                if (isToday) cls += ' today';
                html += `<div class="${cls}" data-day="${d}" data-month="${m}">${d}</div>`;
            }
            html += `</div>`;

            // ---- слой для полос (поверх дней) ----
            html += `<div class="challenge-layer" id="challengeLayer_${m}" style="position:absolute; top:8px; left:10px; right:6px; bottom:8px; pointer-events:none; z-index:5; overflow:visible;"></div>`;
            html += `</div>`; // days-wrapper
            html += `</div>`; // month-row
        }

        container.innerHTML = html;

        // отрисовываем полосы после того, как DOM построен
        renderChallenges();
    }

    // ---------- отрисовка полос (без перекрытия) ----------
    function renderChallenges() {
        for (let m = 0; m < 12; m++) {
            const layer = document.getElementById(`challengeLayer_${m}`);
            if (!layer) continue;
            layer.innerHTML = '';

            const grid = document.getElementById(`daysGrid_${m}`);
            if (!grid) continue;

            const cells = grid.querySelectorAll('.day-cell');
            if (cells.length === 0) continue;

            const layerRect = layer.getBoundingClientRect();
            if (layerRect.width === 0) continue;

            const firstRect = cells[0].getBoundingClientRect();
            const lastRect = cells[cells.length - 1].getBoundingClientRect();
            const cellWidth = firstRect.width + 2;
            const cellHeight = firstRect.height + 2;
            const leftOffset = firstRect.left - layerRect.left;
            const topOffset = firstRect.top - layerRect.top;

            // ---- собираем все полосы для этого месяца ----
            const barsForMonth = [];

            challenges.forEach((ch) => {
                const sM = ch.start.month, eM = ch.end.month;
                if (m < sM || m > eM) return;

                let sDay = (m === sM) ? ch.start.day : 1;
                let eDay = (m === eM) ? ch.end.day : daysInMonth(m, year);
                if (m > sM && m < eM) { sDay = 1; eDay = daysInMonth(m, year); }
                if (m === sM && m === eM) { sDay = ch.start.day; eDay = ch.end.day; }

                const firstIdx = sDay - 1;
                const lastIdx = eDay - 1;
                if (firstIdx < 0 || lastIdx >= cells.length) return;

                const cellStart = cells[firstIdx];
                const cellEnd = cells[lastIdx];
                if (!cellStart || !cellEnd) return;

                const startRect = cellStart.getBoundingClientRect();
                const endRect = cellEnd.getBoundingClientRect();

                const left = startRect.left - layerRect.left;
                const width = (endRect.right - layerRect.left) - left;

                barsForMonth.push({
                    challenge: ch,
                    left: left,
                    width: width,
                    top: topOffset,
                    cellHeight: cellHeight,
                    barHeight: Math.min(cellHeight * 0.75, 32)
                });
            });

            // ---- сортируем по длине (короткие сверху) ----
            barsForMonth.sort((a, b) => a.width - b.width);

            // ---- размещаем без перекрытия (вертикальный стек) ----
            const positions = [];
            const barHeight = barsForMonth.length > 0 ? barsForMonth[0].barHeight : 20;
            const gap = 2;

            barsForMonth.forEach((barData) => {
                let placed = false;
                // пробуем найти свободную вертикальную позицию
                for (let row = 0; row < 10; row++) {
                    const y = topOffset + row * (barHeight + gap);
                    // проверяем пересечение по X с уже размещёнными в этой строке
                    let overlap = false;
                    for (const placedBar of positions) {
                        if (Math.abs(placedBar.row - row) > 0.5) continue;
                        // проверяем пересечение по X
                        const left1 = barData.left;
                        const right1 = barData.left + barData.width;
                        const left2 = placedBar.left;
                        const right2 = placedBar.left + placedBar.width;
                        if (left1 < right2 && right1 > left2) {
                            overlap = true;
                            break;
                        }
                    }
                    if (!overlap) {
                        positions.push({
                            row: row,
                            left: barData.left,
                            width: barData.width,
                            y: y
                        });
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    // если не нашлось места — просто кладём в самую низкую свободную позицию
                    const y = topOffset + positions.length * (barHeight + gap);
                    positions.push({
                        row: positions.length,
                        left: barData.left,
                        width: barData.width,
                        y: y
                    });
                }
            });

            // ---- рисуем полосы по вычисленным позициям ----
            barsForMonth.forEach((barData, idx) => {
                const pos = positions[idx];
                if (!pos) return;

                const ch = barData.challenge;
                const bar = document.createElement('div');
                bar.className = 'challenge-bar';
                bar.style.position = 'absolute';
                bar.style.left = pos.left + 'px';
                bar.style.top = pos.y + 'px';
                bar.style.width = pos.width + 'px';
                bar.style.height = barHeight + 'px';
                bar.style.backgroundColor = ch.color || '#cbd5e1';
                bar.style.opacity = '0.75';
                bar.style.borderRadius = '20px';
                bar.style.pointerEvents = 'auto';
                bar.style.cursor = 'pointer';
                bar.style.display = 'flex';
                bar.style.alignItems = 'center';
                bar.style.paddingLeft = '8px';
                bar.style.fontSize = '10px';
                bar.style.fontWeight = '600';
                bar.style.color = '#0f172a';
                bar.style.whiteSpace = 'nowrap';
                bar.style.overflow = 'hidden';
                bar.style.textOverflow = 'ellipsis';
                bar.style.border = '1px solid rgba(255,255,255,0.2)';
                bar.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                bar.style.zIndex = '10';
                bar.style.transition = 'opacity 0.15s, transform 0.1s, box-shadow 0.15s';

                bar.textContent = `${ch.icon || ''} ${ch.name}`;

                bar.addEventListener('mouseenter', function() {
                    this.style.opacity = '1';
                    this.style.transform = 'scaleY(1.12)';
                    this.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
                    this.style.zIndex = '20';
                });
                bar.addEventListener('mouseleave', function() {
                    this.style.opacity = '0.75';
                    this.style.transform = 'scaleY(1)';
                    this.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                    this.style.zIndex = '10';
                });

                bar.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openModal(ch);
                });

                layer.appendChild(bar);
            });
        }
    }

    // ---------- модальное окно ----------
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBadge = document.getElementById('modalBadge');
    const modalDesc = document.getElementById('modalDesc');
    const modalDates = document.getElementById('modalDates');
    const modalClose = document.getElementById('modalCloseBtn');

    function openModal(ch) {
        if (!modal) return;
        modalTitle.textContent = `${ch.icon || '🎯'} ${ch.name}`;
        modalBadge.textContent = 'Челлендж';
        modalDesc.textContent = ch.description || 'Нет описания';
        const startStr = `${ch.start.day} ${monthNames[ch.start.month]}`;
        const endStr = `${ch.end.day} ${monthNames[ch.end.month]}`;
        modalDates.textContent = `с ${startStr} по ${endStr} ${ch.end.year}`;
        modal.classList.add('active');
    }

    if (modalClose) {
        modalClose.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    // ---------- ресайз ----------
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderChallenges();
        }, 200);
    });

    // ---------- запуск ----------
    document.addEventListener('DOMContentLoaded', renderCalendar);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        renderCalendar();
    }

})();