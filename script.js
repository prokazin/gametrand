// ==== Telegram WebApp ====
const Telegram = window.Telegram.WebApp;
Telegram.expand();

// ==== Настройки игры ====
let balance = parseFloat(localStorage.getItem('balance')) || 1000;
let leverage = 1;
let positions = [];
let history = JSON.parse(localStorage.getItem('history')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let events = [];

const currencies = [
  { name: 'CoinA', price: 46, history: [] },
  { name: 'CoinB', price: 46, history: [] },
  { name: 'CoinC', price: 46, history: [] }
];

let currentCurrencyIndex = 0;

// ==== Chart.js ====
const ctx = document.getElementById('chart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(30).fill(''),
    datasets: [{
      label: currencies[currentCurrencyIndex].name,
      data: Array(30).fill(currencies[currentCurrencyIndex].price),
      borderColor: '#ffdd59',
      fill: false,
      tension: 0.3
    }]
  },
  options: { responsive:true, animation:false, scales:{ x:{display:false}, y:{beginAtZero:false} } }
});

// ==== UI ====
document.getElementById('balanceValue').textContent = balance.toFixed(2);

document.getElementById('currencySelect').addEventListener('change', e => {
  currentCurrencyIndex = parseInt(e.target.value);
  updateChartCurrency();
});

document.getElementById('leverageSelect').addEventListener('change', e => {
  leverage = parseInt(e.target.value);
});

document.getElementById('longBtn').addEventListener('click', () => openPosition('long'));
document.getElementById('shortBtn').addEventListener('click', () => openPosition('short'));
document.getElementById('closeBtn').addEventListener('click', closePositions);
document.getElementById('buyCurrencyBtn').addEventListener('click', buyCurrency);

// ==== События ====
const positiveEvents = ["Рост инвестиций","Позитивные новости","Рост объема торгов"];
const negativeEvents = ["Регуляторные проблемы","Взлом биржи","Резкий обвал рынка"];

setInterval(updatePrices, 1000);
setInterval(triggerEvent, 90000); // 1.5 минуты

updateUI();

// ==== Функции ====
function updateChartCurrency(){
  chart.data.datasets[0].label = currencies[currentCurrencyIndex].name;
  chart.data.datasets[0].data = currencies[currentCurrencyIndex].history.slice(-30);
  chart.update();
}

function updateUI(){
  document.getElementById('balanceValue').textContent = balance.toFixed(2);
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  history.slice(-10).forEach(h=>{
    const li = document.createElement('li');
    li.textContent=`${h.type.toUpperCase()} ${h.currency} $${h.amount} @ ${h.price.toFixed(2)} P/L: ${h.PL.toFixed(2)}`;
    historyList.appendChild(li);
  });
  const lbList = document.getElementById('leaderboardList');
  lbList.innerHTML='';
  leaderboard.push({name:'Вы', balance});
  leaderboard.sort((a,b)=>b.balance-a.balance);
  leaderboard.slice(0,5).forEach(l=>{
    const li = document.createElement('li');
    li.textContent=`${l.name}: $${l.balance.toFixed(2)}`;
    lbList.appendChild(li);
  });
}

function updatePrices(){
  currencies.forEach(c=>{
    let delta = (Math.random()-0.5)*0.4; // плавные колебания
    c.price += delta;
    if(c.price<45)c.price=45;
    if(c.price>47)c.price=47;
    c.history.push(c.price);
    if(c.history.length>30)c.history.shift();
  });
  updateChartCurrency();
}

function openPosition(type){
  const currency = currencies[currentCurrencyIndex].name;
  const amount = 100*leverage;
  positions.push({ type, currency, amount, price: currencies[currentCurrencyIndex].price });
  showNotification(`${type.toUpperCase()} открыта на ${currency} $${amount}`);
}

function closePositions(){
  positions.forEach(p=>{
    const currentPrice = currencies.find(c=>c.name===p.currency).price;
    const PL = (p.type==='long'?currentPrice-p.price:p.price-currentPrice)*(p.amount/p.price);
    balance += PL;
    history.push({...p, PL});
  });
  positions=[];
  saveGame();
  updateUI();
}

function buyCurrency(){
  if(Telegram.WebApp){
    const invoicePayload="buy_virtual_dollars";
    const prices=[{label:"1000$ игровая валюта", amount:100*100}]; // amount в копейках
    Telegram.WebApp.openInvoice({
      title:"Покупка $",
      description:"1000$ внутриигровой валюты",
      payload:invoicePayload,
      provider_token:"<YOUR_PROVIDER_TOKEN>",
      currency:"RUB",
      prices:prices
    });
  }
}

Telegram.WebApp.onEvent('invoiceClosed', (res)=>{
  if(res.status==='paid'){
    balance+=1000;
    saveGame();
    updateUI();
    showNotification("Покупка успешна! +1000$");
  }
});

function triggerEvent(){
  const evList = Math.random()<0.5 ? positiveEvents : negativeEvents;
  const ev = evList[Math.floor(Math.random()*evList.length)];
  showNotification(ev);
  currencies.forEach(c=>{
    let effect = (evList===positiveEvents?1:-1)*(Math.random()*2);
    c.price=Math.min(Math.max(c.price*(1+effect/100),45),47);
  });
}

function saveGame(){
  localStorage.setItem('balance',balance);
  localStorage.setItem('history',JSON.stringify(history));
  localStorage.setItem('leaderboard',JSON.stringify(leaderboard));
}

function showNotification(text){
  const notif = document.getElementById('notification');
  notif.textContent=text;
  notif.style.display='block';
  setTimeout(()=>{notif.style.display='none'},3000);
}
