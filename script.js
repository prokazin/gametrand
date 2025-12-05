let balance = parseFloat(localStorage.getItem("balance")) || 1000;
let history = JSON.parse(localStorage.getItem("history")) || [];
let currentCoin = "BTC";
let price = 100;
let position = null; // {coin, entryPrice}

document.getElementById("balance").textContent = "$" + balance;
updateHistory();

const chartOptions = {
    series: [{
        data: []
    }],
    chart: {
        type: 'line',
        height: 300,
        animations: {enabled: true}
    },
    stroke: {width: 2},
    xaxis: {labels: {show: false}},
    yaxis: {labels: {show: false}},
    grid: {show: false}
};

const chart = new ApexCharts(document.querySelector("#chart"), chartOptions);
chart.render();

function randomMove() {
    let change = (Math.random() - 0.5) * 2;
    price = Math.max(1, price + change);
    return price;
}

setInterval(() => {
    let p = randomMove();
    chart.updateSeries([{ data: [...chart.w.globals.series[0].data, p].slice(-50) }]);
    document.getElementById("currentPrice").textContent = p.toFixed(2);

    if (position) {
        let pnl = price - position.entryPrice;
        document.getElementById("pnl").textContent = pnl.toFixed(2);
    }
}, 1000);

// переключение монет
document.querySelectorAll(".coin-btn").forEach(btn => {
    btn.onclick = () => {
        currentCoin = btn.dataset.coin;
        price = 100 + Math.random() * 50;
        chart.updateSeries([{ data: [] }]);
    };
});

// покупка
document.getElementById("buyBtn").onclick = () => {
    if (position) return alert("У тебя уже есть позиция!");
    position = { coin: currentCoin, entryPrice: price };
    document.getElementById("positionInfo").textContent =
        `${currentCoin} по ${price.toFixed(2)}`;
};

// продажа
document.getElementById("sellBtn").onclick = () => {
    if (!position) return;

    let pnl = price - position.entryPrice;
    balance += pnl;

    history.push({
        coin: position.coin,
        entry: position.entryPrice,
        exit: price,
        pnl,
        time: new Date().toLocaleTimeString()
    });

    position = null;
    localStorage.setItem("balance", balance);
    localStorage.setItem("history", JSON.stringify(history));

    document.getElementById("balance").textContent = "$" + balance.toFixed(2);
    document.getElementById("positionInfo").textContent = "нет";
    document.getElementById("pnl").textContent = "0";

    updateHistory();
};

function updateHistory() {
    document.getElementById("history").innerHTML =
        history.map(h =>
            `<div>(${h.time}) ${h.coin}: ${h.entry.toFixed(2)} → ${h.exit.toFixed(2)} | P&L: ${h.pnl.toFixed(2)}</div>`
        ).join("");
}
