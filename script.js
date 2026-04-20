/**
 * Skoop Live Dashboard - Core Logic
 * Version: 2.0.0
 */

// Configuration
const CONFIG = {
    REFRESH_INTERVAL: 60000 * 5, // 5 minutes for data refresh
    SCROLL_SPEED: 1,            // Pixels per step
    SCROLL_INTERVAL: 50,        // ms
    LAT: 40.7128,               // Default: New York
    LON: -74.0060
};

// State Management
const State = {
    weather: null,
    crypto: { btc: null, eth: null },
    news: [],
    lastUpdate: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);

    // Initial Data Fetch
    fetchAllData();

    // Set up recurring data refresh
    setInterval(fetchAllData, CONFIG.REFRESH_INTERVAL);

    // Set up auto-scroll for signage
    setTimeout(initAutoScroll, 5000);

    // Geolocation (Optional)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            CONFIG.LAT = pos.coords.latitude;
            CONFIG.LON = pos.coords.longitude;
            fetchWeather(); // Re-fetch for local area
        });
    }
});

// --- UI Components ---

function updateClock() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    const greetingEl = document.getElementById('greeting-text');

    const now = new Date();

    // Time
    timeEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // Date
    dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    // Greeting
    const hour = now.getHours();
    if (hour < 12) greetingEl.textContent = 'Good Morning';
    else if (hour < 18) greetingEl.textContent = 'Good Afternoon';
    else greetingEl.textContent = 'Good Evening';
}

async function fetchAllData() {
    console.log('Fetching live data update...');

    try {
        await Promise.all([
            fetchWeather(),
            fetchCrypto(),
            fetchNews()
        ]);

        document.getElementById('network-status').textContent = 'Online';
        document.getElementById('network-status').style.background = 'var(--primary)';
        State.lastUpdate = new Date();
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('network-status').textContent = 'Offline (Cached)';
        document.getElementById('network-status').style.background = 'var(--secondary)';
    }
}

// --- Data Fetching ---

async function fetchWeather() {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.LAT}&longitude=${CONFIG.LON}&current_weather=true`, { cache: 'no-store' });
        const data = await res.json();

        if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const condition = getWeatherCondition(code);

            document.querySelector('#weather-widget .temp').textContent = `${temp}°C`;
            document.querySelector('#weather-widget .condition').textContent = condition;

            // Save to localStorage
            localStorage.setItem('cached_weather', JSON.stringify({ temp, condition }));
        }
    } catch (err) {
        const cached = JSON.parse(localStorage.getItem('cached_weather'));
        if (cached) {
            document.querySelector('#weather-widget .temp').textContent = `${cached.temp}°C`;
            document.querySelector('#weather-widget .condition').textContent = cached.condition;
        }
        throw err;
    }
}

async function fetchCrypto() {
    try {
        // Fetch BTC and ETH prices from Binance public API
        const symbols = ['BTCUSDT', 'ETHUSDT'];
        const results = await Promise.all(symbols.map(s =>
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`, { cache: 'no-store' }).then(r => r.json())
        ));

        results.forEach(data => {
            const symbol = data.symbol.replace('USDT', '').toLowerCase();
            const price = parseFloat(data.lastPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            const change = parseFloat(data.priceChangePercent).toFixed(2);

            const cardEl = document.getElementById(`${symbol}-card`);
            const trendEl = document.getElementById(`${symbol}-trend`);

            cardEl.querySelector('.stat-value').textContent = price;
            trendEl.textContent = `${change > 0 ? '+' : ''}${change}%`;
            trendEl.className = `stat-trend ${change >= 0 ? 'trend-up' : 'trend-down'}`;
        });

        localStorage.setItem('cached_crypto', JSON.stringify(results));
    } catch (err) {
        // Fallback handled by catch in fetchAllData or prior UI state
        throw err;
    }
}

async function fetchNews() {
    try {
        // Fetch top tech news from HackerNews (Algolia)
        const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=8', { cache: 'no-store' });
        const data = await res.json();

        const newsList = document.getElementById('news-list');
        newsList.innerHTML = '';

        data.hits.forEach(hit => {
            const card = document.createElement('div');
            card.className = 'news-card';

            const timeAgo = getTimeAgo(hit.created_at_i);

            card.innerHTML = `
                <div class="news-source">${hit.author} • ${hit.points} pts</div>
                <div class="news-title">${hit.title}</div>
                <div class="news-time">${timeAgo}</div>
            `;
            newsList.appendChild(card);
        });

        localStorage.setItem('cached_news', JSON.stringify(data.hits));
    } catch (err) {
        const cached = JSON.parse(localStorage.getItem('cached_news'));
        if (cached) {
            // Render cached
            const newsList = document.getElementById('news-list');
            newsList.innerHTML = '';
            cached.forEach(hit => {
                const card = document.createElement('div');
                card.className = 'news-card';
                card.innerHTML = `
                    <div class="news-source">${hit.author}</div>
                    <div class="news-title">${hit.title}</div>
                    <div class="news-time">Recently cached</div>
                `;
                newsList.appendChild(card);
            });
        }
        throw err;
    }
}

// --- Helpers ---

function getWeatherCondition(code) {
    const map = {
        0: 'Clear Sky',
        1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing Rime Fog',
        51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
        61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
        71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
        95: 'Thunderstorm'
    };
    return map[code] || 'Clear';
}

function getTimeAgo(epoch) {
    const seconds = Math.floor(Date.now() / 1000 - epoch);
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

function initAutoScroll() {
    const content = document.querySelector('.content');
    if (content.scrollHeight <= content.clientHeight) return;

    let isScrollingDown = true;

    setInterval(() => {
        if (isScrollingDown) {
            content.scrollTop += CONFIG.SCROLL_SPEED;
            if (content.scrollTop + content.clientHeight >= content.scrollHeight - 1) {
                // Pause at bottom
                isScrollingDown = false;
                setTimeout(() => {
                    content.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => { isScrollingDown = true; }, 2000);
                }, 3000);
            }
        }
    }, CONFIG.SCROLL_INTERVAL);
}
