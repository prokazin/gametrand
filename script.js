// ==== Настройки игры ====
let balance = parseFloat(localStorage.getItem('balance')) || 1000;
let leverage = 1;
let positions = [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let events = [];
const currencies = [
  { name: 'CoinA', price: 10, history: [] },
  { name: 'CoinB', price: 5, history: [] },
  { name: 'CoinC', price: 1, history: [] },
];

const ctx = document.getElementById('chart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(30).fill(''),
    datasets: currencies.map(c => ({
      label: c.name,
      data: Array(30).fill(c.price),
      borderColor: getRandomColor(),
      fill: false
    }))
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      x: { display: false },
      y: { beginAtZero: true }
    }
  }
});

updateUI();
setInterval(updatePrices, 1000);
setInterval(triggerEvent, 90000); // 1.5 минуты

// ==== События ====
const positiveEvents = [
  "Рост институциональных инвестиций", "Позитивные новости о монете", "Рост объема торгов"
];
const negativeEvents = [
  "Регуляторные проблемы", "Взлом биржи", "Резкий обвал рынка"
];

// ==== UI элементы ====
document.getElementById('balanceValue').textContent = balance.toFixed(2);

document.getElementById('leverageSelect').addEventListener('change', e => {
  leverage = parseInt(e.target.value);
});

document.getElementById('longBtn').addEventListener('click', () => openPosition('long'));
document.getElementById('shortBtn').addEventListener('click', () => openPosition('short'));
document.getElementById('closeBtn').addEventListener('click', closePositions);
document.getElementById('buyCurrencyBtn').addEventListener('click', buyCurrency);

// ==== Функции ====
function updateUI() {
  document.getElementById('balanceValue').textContent = balance.toFixed(2);
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  history.slice(-10).forEach(h => {
    const li = document.createElement('li');
    li.textContent = `${h.type.toUpperCase()} ${h.currency} $${h.amount} @ ${h.price.toFixed(2)} P/L: ${h.PL.toFixed(2)}`;
    historyList.appendChild(li);
  });
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';
  events.slice(-5).forEach(ev => {
    const li = document.createElement('li');
    li.textContent = ev;
    eventsList.appendChild(li);
  });
  updateLeaderboard();
}

function updatePrices() {
  currencies.forEach(c => {
    // Цена изменяется случайно + влияние позиций
    let netEffect = positions
      .filter(p => p.currency === c.name)
      .reduce((sum, p) => p.type === 'long' ? sum + p.amount*0.01 : sum - p.amount*0.01, 0);
    let change = (Math.random() - 0.5) * 0.5 + netEffect;
    c.price = Math.max(0.01, c.price + change);
    c.history.push(c.price);
    if (c.history.length > 30) c.history.shift();
  });
  chart.data.datasets.forEach((ds,i) => {
    ds.data = currencies[i].history;
  });
  chart.update();
}

function openPosition(type) {
  const currency = currencies[Math.floor(Math.random()*currencies.length)].name;
  const amount = 100 * leverage;
  positions.push({ type, currency, amount, price: currencies.find(c=>c.name===currency).price });
  alert(`${type.toUpperCase()} открыта на ${currency} $${amount}`);
}

function closePositions() {
  positions.forEach(p => {
    const currentPrice = currencies.find(c=>c.name===p.currency).price;
    const PL = (p.type === 'long' ? currentPrice - p.price : p.price - currentPrice) * (p.amount / p.price);
    balance += PL;
    history.push({ ...p, PL });
  });
  positions = [];
  saveGame();
  updateUI();
}

function buyCurrency() {
  if (window.Telegram.WebApp) {
    // Триггер оплаты через Telegram Stars
    alert('Здесь будет интеграция Telegram Stars');
  } else {
    const amount = prompt('Введите сумму покупки виртуальных $');
    balance += parseFloat(amount) || 0;
    saveGame();
    updateUI();
  }
}

function triggerEvent() {
  const evList = Math.random()<0.5 ? positiveEvents : negativeEvents;
  const ev = evList[Math.floor(Math.random()*evList.length)];
  events.push(ev);
  // Изменяем цены на ±1-3%
  currencies.forEach(c => {
    let effect = (evList === positiveEvents ? 1 : -1) * (Math.random()*3);
    c.price = Math.max(0.01, c.price * (1 + effect/100));
  });
  updateUI();
}

function saveGame() {
  localStorage.setItem('balance', balance);
  localStorage.setItem('history', JSON.stringify(history));
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function updateLeaderboard() {
  // Временный локальный рейтинг
  leaderboard = leaderboard.filter(l => l.name);
  leaderboard.push({name:'Вы', balance: balance});
  leaderboard.sort((a,b)=>b.balance - a.balance);
  const lbList = document.getElementById('leaderboardList');
  lbList.innerHTML = '';
  leaderboard.slice(0,5).forEach(l => {
    const li = document.createElement('li');
    li.textContent = `${l.name}: $${l.balance.toFixed(2)}`;
    lbList.appendChild(li);
  });
}

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}
