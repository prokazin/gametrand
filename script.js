let balance = parseFloat(localStorage.getItem("balance")) || 1000;
let openPositions = JSON.parse(localStorage.getItem("openPositions")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let rating = JSON.parse(localStorage.getItem("rating")) || [];

let currentCoin = "TON";
let price = 100;
let leverage = 1;

document.getElementById("balance").textContent = "$" + balance.toFixed(2);

// ========== ТАБЫ ==========
document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");

        updateOpenPositions();
        updateHistory();
        updateRating();
    };
});

// ========== ГРАФИК ==========
let chartOptions = {
    chart: {
        type: 'line',
        height: 320,
        animations: { enabled: true }
    },
    series: [{ data: [] }],
    stroke: { width: 2 },
    xaxis: { labels: { show: false }},
    yaxis: { labels: { show: false }},
    grid: { show: false },
    annotations: {
        points: []
    }
};

let chart = new ApexCharts(document.querySelector("#chart"), chartOptions);
chart.render();

// движение цены
function randomMove() {
    price += (Math.random() - 0.5) * 3;
    price = Math.max(0.1, price);
    return price;
}

setInterval(() => {
    let newPrice = randomMove();
    let oldData = chart.w.globals.series[0].data;
    chart.updateSeries([{ data: [...oldData, newPrice].slice(-60) }]);

    document.getElementById("currentPrice").textContent = newPrice.toFixed(3);
}, 700);

// ========== ПЕРЕКЛЮЧЕНИЕ МОНЕТ ==========
document.querySelectorAll(".coin-btn").forEach(btn => {
    btn.onclick = () => {
        currentCoin = btn.dataset.coin;
        price = 50 + Math.random() * 100;
        chart.updateSeries([{ data: [] }]);
        chart.updateOptions({ annotations: { points: [] } });
    };
});

// ========== ПЛЕЧО ==========
document.getElementById("leverageSelect").onchange = e => {
    leverage = parseInt(e.target.value);
};

// ========== ОТКРЫТИЕ ПОЗИЦИИ ==========
function openPosition(type) {
    openPositions.push({
        coin: currentCoin,
        entry: price,
        type,
        leverage,
        time: new Date().toLocaleTimeString()
    });

    chart.addPointAnnotation({
        x: chart.w.globals.series[0].data.length,
        y: price,
        marker: { size: 6, fillColor: type === "LONG" ? "#00c13d" : "#ff3b3b" },
        label: { text: type }
    });

    saveAll();
    updateOpenPositions();
}

document.getElementById("longBtn").onclick = () => openPosition("LONG");
document.getElementById("shortBtn").onclick = () => openPosition("SHORT");

// ========== ЗАКРЫТИЕ ПОЗИЦИИ ==========
function closePosition(index) {
    let pos = openPositions[index];

    let diff = price - pos.entry;
    let pnl = pos.type === "LONG" ? diff : -diff;
    pnl *= pos.leverage;

    balance += pnl;

    history.push({
        ...pos,
        exit: price,
        pnl,
        closeTime: new Date().toLocaleTimeString()
    });

    openPositions.splice(index, 1);

    rating.push({ score: balance, time: Date.now() });

    saveAll();
    updateOpenPositions();
    updateHistory();
    updateRating();

    document.getElementById("balance").textContent = "$" + balance.toFixed(2);
}

// ========== ОБНОВЛЕНИЕ СПИСКОВ ==========
function updateOpenPositions() {
    const box = document.getElementById("openPositions");
    box.innerHTML = "";

    openPositions.forEach((p, i) => {
        let pnl = (p.type === "LONG" ? price - p.entry : p.entry - price) * p.leverage;

        box.innerHTML += `
            <div class="position-item">
                ${p.coin} | ${p.type} x${p.leverage}<br>
                Вход: ${p.entry.toFixed(3)} | Текущая: ${price.toFixed(3)}<br>
                P&L: ${pnl.toFixed(3)}
                <button class="close-btn" onclick="closePosition(${i})">Закрыть</button>
            </div>
        `;
    });
}

function updateHistory() {
    const box = document.getElementById("historyList");
    box.innerHTML = "";

    history.forEach(h => {
        box.innerHTML += `
            <div class="history-item">
                ${h.time} → ${h.closeTime}<br>
                ${h.coin} | ${h.type} x${h.leverage}<br>
                ${h.entry.toFixed(3)} → ${h.exit.toFixed(3)} | P&L: ${h.pnl.toFixed(3)}
            </div>
        `;
    });
}

function updateRating() {
    const list = document.getElementById("ratingList");

    let sorted = [...rating].sort((a,b)=>b.score - a.score);

    list.innerHTML = sorted.slice(0, 10).map(r => `
        <div class="rating-item">
            Баланс: $${r.score.toFixed(2)}
        </div>
    `).join("");
}

// ========== SAVE ==========
function saveAll() {
    localStorage.setItem("balance", balance);
    localStorage.setItem("openPositions", JSON.stringify(openPositions));
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("rating", JSON.stringify(rating));
}

// Первичное обновление
updateOpenPositions();
updateHistory();
updateRating();
