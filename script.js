let balance = parseFloat(localStorage.getItem("balance")) || 1000;
let openPositions = JSON.parse(localStorage.getItem("openPositions")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let currentCoin = "TON";
let price = 100;

document.getElementById("balance").textContent = "$" + balance.toFixed(2);

// ТАБЫ
document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");
    };
});

// ЧАРТ
const chart = new ApexCharts(document.querySelector("#chart"), {
    series: [{ data: [] }],
    chart: { type: 'line', height: 300, animations: { enabled: true }},
    stroke: { width: 2 },
    xaxis: { labels: { show: false }},
    yaxis: { labels: { show: false }},
    grid: { show: false }
});
chart.render();

// Обновление цены
function randomMove() {
    let move = (Math.random() - 0.5) * 5;
    price = Math.max(0.1, price + move);
    return price;
}

setInterval(() => {
    let p = randomMove();
    chart.updateSeries([{ data: [...chart.w.globals.series[0].data, p].slice(-50) }]);
    document.getElementById("currentPrice").textContent = p.toFixed(2);
}, 800);

// Переключение монет
document.querySelectorAll(".coin-btn").forEach(btn => {
    btn.onclick = () => {
        currentCoin = btn.dataset.coin;
        price = 50 + Math.random() * 100;
        chart.updateSeries([{ data: [] }]);
    };
});

// Покупка
document.getElementById("buyBtn").onclick = () => {
    openPositions.push({
        coin: currentCoin,
        entry: price,
        time: new Date().toLocaleTimeString()
    });
    saveAll();
    updateOpenPositions();
};

// Закрытие позиции
function closePosition(index) {
    let pos = openPositions[index];
    let pnl = price - pos.entry;
    balance += pnl;

    history.push({
        coin: pos.coin,
        entry: pos.entry,
        exit: price,
        pnl,
        time: new Date().toLocaleTimeString()
    });

    openPositions.splice(index, 1);
    saveAll();
    updateOpenPositions();
    updateHistory();
    document.getElementById("balance").textContent = "$" + balance.toFixed(2);
}

// Открытые позиции
function updateOpenPositions() {
    const box = document.getElementById("openPositionsList");
    box.innerHTML = "";

    openPositions.forEach((pos, i) => {
        box.innerHTML += `
        <div class="position-item">
            ${pos.coin} | Вход: ${pos.entry.toFixed(2)} | Текущая: ${price.toFixed(2)}<br>
            P&L: ${(price - pos.entry).toFixed(2)}
            <button class="close-btn" onclick="closePosition(${i})">Закрыть</button>
        </div>
        `;
    });
}

// История
function updateHistory() {
    const box = document.getElementById("historyList");
    box.innerHTML = "";

    history.forEach(h => {
        box.innerHTML += `
        <div class="history-item">
            ${h.time} — ${h.coin}<br>
            ${h.entry.toFixed(2)} → ${h.exit.toFixed(2)} | P&L: ${h.pnl.toFixed(2)}
        </div>
        `;
    });
}

function saveAll() {
    localStorage.setItem("balance", balance);
    localStorage.setItem("openPositions", JSON.stringify(openPositions));
    localStorage.setItem("history", JSON.stringify(history));
}

// Первичное обновление
updateOpenPositions();
updateHistory();
