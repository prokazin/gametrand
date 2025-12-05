let balance = 1000;
let currentCoin = "TON";
let price = 100;
let leverage = 1;
let positions = [];

document.getElementById("balance").textContent = "$" + balance;

// ---------- APEXCHARTS (рабочий) ----------
let chartData = [];

let chartOptions = {
    chart: {
        type: "line",
        height: 300,
        animations: { enabled: true }
    },
    series: [{ name: "Price", data: [] }],
    stroke: { width: 2 },
    xaxis: { labels: { show: false } },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    annotations: { points: [] }
};

let chart = new ApexCharts(document.querySelector("#chart"), chartOptions);
chart.render();

// Движение цены
function updatePrice() {
    price += (Math.random() - 0.5) * 2;
    price = Math.max(0.1, price);
    chartData.push(price);
    chartData = chartData.slice(-60);

    chart.updateSeries([{ data: chartData }]);
}
setInterval(updatePrice, 800);

// ---------- Выбор монеты ----------
document.querySelectorAll(".coin-btn").forEach(btn => {
    btn.onclick = () => {
        currentCoin = btn.dataset.coin;
        price = 50 + Math.random() * 100;
        chartData = [];
        chart.updateSeries([{ data: [] }]);
        chart.updateOptions({ annotations: { points: [] } });
    };
});

// ---------- Плечо ----------
document.getElementById("leverage").onchange = (e) => {
    leverage = parseInt(e.target.value);
};

// ---------- LONG / SHORT ----------
function openPosition(type) {
    positions.push({
        type,
        coin: currentCoin,
        entry: price,
        leverage
    });

    // Точка входа на графике
    chart.addPointAnnotation({
        x: chartData.length - 1,
        y: price,
        marker: {
            size: 6,
            fillColor: type === "LONG" ? "#00c13d" : "#ff3b3b"
        },
        label: {
            text: type,
            style: { color: "#fff", background: type === "LONG" ? "#00c13d" : "#ff3b3b" }
        }
    });

    updatePositions();
}

document.getElementById("longBtn").onclick = () => openPosition("LONG");
document.getElementById("shortBtn").onclick = () => openPosition("SHORT");

// ---------- Обновление открытых позиций ----------
function updatePositions() {
    const box = document.getElementById("positions");
    box.innerHTML = "";

    positions.forEach(pos => {
        let pnl = (pos.type === "LONG" ? price - pos.entry : pos.entry - price) * pos.leverage;

        box.innerHTML += `
            <div class="position-item">
                ${pos.coin} | ${pos.type} x${pos.leverage}<br>
                Вход: ${pos.entry.toFixed(3)}<br>
                Текущая: ${price.toFixed(3)}<br>
                PNL: ${pnl.toFixed(3)}
            </div>
        `;
    });
}

setInterval(updatePositions, 500);
