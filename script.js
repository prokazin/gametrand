// Game state
const gameState = {
    balance: 1000,
    currentCoin: 'TON',
    tradeType: 'LONG',
    positions: [],
    history: [],
    ranking: [],
    playerName: 'Player'
};

// Coin data
const coins = {
    'TON': { price: 2.50, history: [], color: '#0088cc' },
    'ETH': { price: 3200.00, history: [], color: '#627eea' },
    'DOGE': { price: 0.15, history: [], color: '#c2a633' }
};

// Chart and series
let chart = null;
let lineSeries = null;
let markers = [];
let priceUpdateInterval = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    loadGameState();
    initChart();
    initEventListeners();
    updateUI();
    startPriceUpdates();
});

// Initialize TradingView chart
function initChart() {
    const chartContainer = document.getElementById('chart');
    chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 400,
        layout: {
            backgroundColor: '#161622',
            textColor: '#d1d4dc',
        },
        grid: {
            vertLines: {
                color: 'rgba(42, 46, 57, 0.6)',
            },
            horzLines: {
                color: 'rgba(42, 46, 57, 0.6)',
            },
        },
        rightPriceScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
            timeVisible: true,
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
    });

    lineSeries = chart.addLineSeries({
        color: coins[gameState.currentCoin].color,
        lineWidth: 2,
        crosshairMarkerVisible: true,
    });

    // Generate initial data
    generateInitialData();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        chart.applyOptions({ width: chartContainer.clientWidth });
    });
}

// Generate initial price data
function generateInitialData() {
    const currentCoin = coins[gameState.currentCoin];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const data = [];
    
    // Generate 100 data points (approx 4 hours if updating every 2.5 minutes)
    for (let i = 100; i >= 0; i--) {
        const time = now - (i * 2.5 * 60 * 1000);
        const price = i === 100 ? currentCoin.price : data[data.length - 1].value;
        const newPrice = price * (1 + (Math.random() - 0.5) * 0.02);
        
        data.push({
            time: time / 1000,
            value: newPrice,
        });
    }
    
    currentCoin.history = data;
    lineSeries.setData(data);
    updateChartMarkers();
}

// Initialize event listeners
function initEventListeners() {
    // Coin selector
    document.getElementById('coin-select').addEventListener('change', function(e) {
        gameState.currentCoin = e.target.value.split(' ')[0];
        switchChartData();
        updateUI();
    });

    // Trade type buttons
    document.getElementById('long-btn').addEventListener('click', () => {
        gameState.tradeType = 'LONG';
        document.getElementById('long-btn').classList.add('active');
        document.getElementById('short-btn').classList.remove('active');
        updateUI();
    });

    document.getElementById('short-btn').addEventListener('click', () => {
        gameState.tradeType = 'SHORT';
        document.getElementById('short-btn').classList.add('active');
        document.getElementById('long-btn').classList.remove('active');
        updateUI();
    });

    // Leverage and amount
    document.getElementById('leverage').addEventListener('change', updateUI);
    document.getElementById('amount').addEventListener('input', updateUI);
    
    // Amount buttons
    document.querySelectorAll('.btn-amount').forEach(btn => {
        btn.addEventListener('click', function() {
            const mult = parseFloat(this.dataset.mult);
            const amount = Math.floor(gameState.balance * mult);
            document.getElementById('amount').value = amount;
            updateUI();
        });
    });

    // Open position
    document.getElementById('open-position').addEventListener('click', openPosition);

    // Reset game
    document.getElementById('reset-game').addEventListener('click', resetGame);

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Add to ranking
    document.getElementById('add-to-ranking').addEventListener('click', addToRanking);
    document.getElementById('player-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addToRanking();
    });
}

// Switch chart data when coin changes
function switchChartData() {
    const currentCoin = coins[gameState.currentCoin];
    
    // If we don't have history for this coin, generate it
    if (currentCoin.history.length === 0) {
        generateInitialData();
    } else {
        lineSeries.setData(currentCoin.history);
    }
    
    lineSeries.applyOptions({ color: currentCoin.color });
    updateChartMarkers();
}

// Update UI elements
function updateUI() {
    // Update balance
    document.getElementById('balance').textContent = `$${gameState.balance.toFixed(2)}`;
    
    // Update current price display
    const currentCoin = coins[gameState.currentCoin];
    const priceChange = calculatePriceChange();
    document.getElementById('current-price-label').textContent = `${gameState.currentCoin}: $${currentCoin.price.toFixed(2)}`;
    document.getElementById('price-change').textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
    document.getElementById('price-change').className = priceChange >= 0 ? 'positive' : 'negative';
    
    // Update position size
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const leverage = parseInt(document.getElementById('leverage').value);
    const positionSize = amount * leverage;
    document.getElementById('position-size').textContent = `$${positionSize.toFixed(2)}`;
    
    // Update fees (0.1%)
    const fees = amount * 0.001;
    document.getElementById('fees').textContent = `$${fees.toFixed(2)}`;
    
    // Update positions list
    updatePositionsList();
    
    // Update history list
    updateHistoryList();
    
    // Update ranking
    updateRankingList();
}

// Calculate price change percentage
function calculatePriceChange() {
    const currentCoin = coins[gameState.currentCoin];
    if (currentCoin.history.length < 2) return 0;
    
    const currentPrice = currentCoin.price;
    const prevPrice = currentCoin.history[currentCoin.history.length - 2].value;
    return ((currentPrice - prevPrice) / prevPrice) * 100;
}

// Start price updates
function startPriceUpdates() {
    if (priceUpdateInterval) clearInterval(priceUpdateInterval);
    
    priceUpdateInterval = setInterval(() => {
        updatePrices();
        updateUI();
        updateChart();
    }, 2500); // Update every 2.5 seconds
}

// Update prices randomly
function updatePrices() {
    for (const coin in coins) {
        const change = (Math.random() - 0.5) * 0.02; // +/- 1% max
        coins[coin].price *= (1 + change);
        
        // Add to history
        coins[coin].history.push({
            time: Date.now() / 1000,
            value: coins[coin].price
        });
        
        // Keep only last 200 points
        if (coins[coin].history.length > 200) {
            coins[coin].history.shift();
        }
    }
    
    // Update positions P&L
    updatePositionsPnL();
}

// Update chart with new price
function updateChart() {
    const currentCoin = coins[gameState.currentCoin];
    const latestData = currentCoin.history[currentCoin.history.length - 1];
    lineSeries.update(latestData);
}

// Update positions P&L
function updatePositionsPnL() {
    let hasChanges = false;
    
    gameState.positions.forEach(position => {
        const currentPrice = coins[position.coin].price;
        const priceDiff = currentPrice - position.entryPrice;
        
        if (position.type === 'LONG') {
            position.pnl = position.amount * position.leverage * (priceDiff / position.entryPrice);
        } else {
            position.pnl = position.amount * position.leverage * (-priceDiff / position.entryPrice);
        }
        
        position.currentPrice = currentPrice;
        hasChanges = true;
    });
    
    if (hasChanges) {
        saveGameState();
        updatePositionsList();
    }
}

// Open a new position
function openPosition() {
    const amount = parseFloat(document.getElementById('amount').value);
    const leverage = parseInt(document.getElementById('leverage').value);
    
    // Validate
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (amount > gameState.balance) {
        alert('Insufficient balance');
        return;
    }
    
    // Calculate fees (0.1%)
    const fees = amount * 0.001;
    const totalCost = amount + fees;
    
    if (totalCost > gameState.balance) {
        alert('Insufficient balance to cover fees');
        return;
    }
    
    // Deduct from balance
    gameState.balance -= totalCost;
    
    // Create position
    const position = {
        id: Date.now(),
        coin: gameState.currentCoin,
        type: gameState.tradeType,
        leverage: leverage,
        amount: amount,
        entryPrice: coins[gameState.currentCoin].price,
        currentPrice: coins[gameState.currentCoin].price,
        pnl: 0,
        timestamp: Date.now()
    };
    
    gameState.positions.push(position);
    
    // Add marker to chart
    addChartMarker(position);
    
    // Save and update
    saveGameState();
    updateUI();
    
    // Show confirmation
    alert(`${position.type} position opened for ${position.coin} with ${leverage}x leverage!`);
}

// Close
