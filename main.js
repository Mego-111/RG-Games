const API_KEY = 'd0b4de9525814327ae4b68052f5ea1d4';
 
let currentPage = 1;
let checkPage = 1;
let currentPlatform = '';

async function getGames(page = 1) {
    const cached = sessionStorage.getItem(`games_page_${page}`);
    const grid = document.getElementById('games-grid');
    let results;
    if (cached) {
        results = JSON.parse(cached);
    } else {
        const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&ordering=-added&page=${page}`);
        const data = await response.json();
        results = data.results;
        sessionStorage.setItem(`games_page_${page}`, JSON.stringify(results));
    }
    results.forEach(game => {
        const esrb = game.esrb_rating?.name || '';
        let esrbBadge = '';
        if (esrb.includes('Adults') || esrb.includes('Mature')) {
            esrbBadge = `<span style="color:#e63946;font-weight:700">+18</span>`;
        } else if (esrb.includes('Teen')) {
            esrbBadge = `<span style="color:#ffd60a;font-weight:700">+12</span>`;
        } else if (esrb.includes('Everyone')) {
            esrbBadge = `<span style="color:#2d9e5f;font-weight:700">+3</span>`;
        }
        grid.innerHTML += `
            <div class="game-card" onclick="sessionStorage.setItem('savedGames', document.getElementById('games-grid').innerHTML); sessionStorage.setItem('savedPage', currentPage); sessionStorage.setItem('scrollPos', window.scrollY); location.href='game.html?id=${game.id}'">
                <img class="card-img" src="${game.background_image}" alt="${game.name}">
                <button class="fav-btn ${isFavorite(game.id) ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleFavorite(${game.id}, '${game.name}', '${game.background_image}', ${game.rating}); this.classList.toggle('active'); this.style.color = this.classList.contains('active') ? '#ffd60a' : '#888'">
                    <i class="fa-solid fa-star"></i>
                </button>
                <div class="card-info">
                    <div class="card-title">${game.name}</div>
                    <div class="card-meta">⭐ ${game.rating} · ${game.released} · ${esrbBadge}</div>
                </div>
            </div>`;
    });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const genre = this.dataset.genre;
        const grid = document.getElementById('games-grid');
        grid.innerHTML = '';
        currentPage = 1;
        sessionStorage.removeItem('savedGames');
        const url = genre
            ? `https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&ordering=-added&genres=${genre}`
            : `https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&ordering=-added`;
        const response = await fetch(url);
        const data = await response.json();
        data.results.forEach(game => {
            const esrb = game.esrb_rating?.name || '';
            let esrbBadge = '';
            if (esrb.includes('Adults') || esrb.includes('Mature')) {
                esrbBadge = `<span style="color:#e63946;font-weight:700">+18</span>`;
            } else if (esrb.includes('Teen')) {
                esrbBadge = `<span style="color:#ffd60a;font-weight:700">+12</span>`;
            } else if (esrb.includes('Everyone')) {
                esrbBadge = `<span style="color:#2d9e5f;font-weight:700">+3</span>`;
            }
            grid.innerHTML += `
                <div class="game-card" onclick="location.href='game.html?id=${game.id}'">
                    <img class="card-img" src="${game.background_image}" alt="${game.name}">
                    <div class="card-info">
                        <div class="card-title">${game.name}</div>
                        <div class="card-meta">⭐ ${game.rating} · ${game.released} · ${esrbBadge}</div>
                    </div>
                </div>`;
        });
    });
});

async function loadMore() {
    currentPage++;
    await getGames(currentPage);
}
 
if (document.getElementById('games-grid')) {
    const savedGames = sessionStorage.getItem('savedGames');
    const savedPage = sessionStorage.getItem('savedPage');
    const grid = document.getElementById('games-grid');
 
    if (savedGames) {
        grid.innerHTML = savedGames;
        currentPage = parseInt(savedPage) || 1;
        setTimeout(() => {
            window.scrollTo(0, parseInt(sessionStorage.getItem('scrollPos') || 0));
        }, 100);
    } else {
        getGames(1);
    }
 
    document.getElementById('games-grid').insertAdjacentHTML('afterend', `
        <div style="text-align:center;margin:2rem 0">
            <button class="btn-primary" onclick="loadMore()">عرض المزيد</button>
        </div>`);
}

async function getGameDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
    const game = await response.json();
    document.getElementById('game-details').innerHTML = `
        <div class="details-container">
            <img src="${game.background_image}" alt="${game.name}">
            <div class="details-info">
                <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
                    <h1 style="margin:0">${game.name}</h1>
                    <button onclick="toggleFavorite(${game.id}, '${game.name}', '${game.background_image}', ${game.rating}); this.classList.toggle('active'); this.style.color = this.classList.contains('active') ? '#ffd60a' : '#888'" 
                        class="fav-btn ${isFavorite(game.id) ? 'active' : ''}" style="opacity:1;position:relative;top:unset;right:unset">
                        <i class="fa-solid fa-star"></i>
                    </button>
                </div>
                <p>⭐ ${game.rating} · ${game.released}</p>
                <p>🎮 ${game.platforms.map(p => p.platform.name).join(' · ')}</p>
                <h3>متطلبات التشغيل:</h3>
                <p>${game.platforms[0]?.requirements?.minimum || 'مش متاح'}</p>
            </div>
        </div>`;
}
 
if (document.getElementById('game-details')) {
    getGameDetails();
}

if (document.getElementById('check-section')) {
    document.getElementById('check-section').innerHTML = `
        <div class="check-form">
            <h2>حط مواصفات جهازك</h2>
            <div class="form-group">
                <label>نوع الجهاز</label>
                <select id="platform">
                    <option value="pc">💻 PC / Windows</option>
                    <option value="mac">🍎 Mac</option>
                    <option value="ios">📱 iPhone / iPad</option>
                    <option value="android">🤖 Android</option>
                    <option value="playstation">🎮 PlayStation</option>
                    <option value="xbox">🎮 Xbox</option>
                </select>
            </div>
            <div class="form-group" id="ram-group">
                <label>الـ RAM (GB)</label>
                <input type="number" id="ram" placeholder="مثال: 8">
            </div>
            <div class="form-group" id="gpu-group">
                <label>كارت الشاشة</label>
                <input type="text" id="gpu" placeholder="مثال: GTX 1060">
            </div>
            <div class="form-group" id="cpu-group">
                <label>المعالج (CPU)</label>
                <input type="text" id="cpu" placeholder="مثال: Intel i5">
            </div>
            <button class="btn-primary" onclick="checkSpecs()">تحقق دلوقتي</button>
        </div>
        <div class="check-results" id="check-results"></div>`;
 
    document.getElementById('platform').addEventListener('change', function () {
        const platform = this.value;
        const ramGroup = document.getElementById('ram-group');
        const gpuGroup = document.getElementById('gpu-group');
        const cpuGroup = document.getElementById('cpu-group');
        if (platform === 'ios' || platform === 'android') {
            ramGroup.style.display = 'none';
            gpuGroup.style.display = 'none';
            cpuGroup.style.display = 'none';
        } else {
            ramGroup.style.display = 'block';
            gpuGroup.style.display = 'block';
            cpuGroup.style.display = 'block';
        }
    });

    const savedCheck = sessionStorage.getItem('savedCheck');
        if (savedCheck) {
            document.getElementById('check-results').innerHTML = savedCheck;
        }
}

async function checkSpecs() {
    const platform = document.getElementById('platform').value;
    const container = document.getElementById('check-results');
    container.innerHTML = `<p style="color:#888;padding:1rem 0">جاري البحث...</p>`;
    const platformMap = {
        'pc': 'PC',
        'mac': 'macOS',
        'ios': 'iOS',
        'android': 'Android',
        'playstation': 'PlayStation 5',
        'xbox': 'Xbox Series S/X'
    };
    const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&ordering=-rating&platforms=${getPlatformId(platform)}`);
    const data = await response.json();
    const details = await Promise.all(
        data.results.map(game =>
            fetch(`https://api.rawg.io/api/games/${game.id}?key=${API_KEY}`).then(r => r.json())
        )
    );
    const results = details.filter(game => {
        const platforms = game.platforms?.map(p => p.platform.name) || [];
        return platforms.some(p => p.toLowerCase().includes(platformMap[platform].toLowerCase()));
    });
    if (results.length === 0) {
        container.innerHTML = `<p style="color:#888">مفيش ألعاب مناسبة لمواصفاتك</p>`;
        return;
    }
    currentPlatform = platform;
    checkPage = 1;
    container.innerHTML = `
        <h3 style="color:#ffd60a;padding:1rem 0">الألعاب المناسبة ليك:</h3>
        <div class="games-grid" id="check-results-grid">
            ${results.map(game => `
                <div class="game-card" onclick="sessionStorage.setItem('savedCheck', document.getElementById('check-results').innerHTML); location.href='game.html?id=${game.id}'">
                    <img class="card-img" src="${game.background_image}" alt="${game.name}">
                    <div class="card-info">
                        <div class="card-title">${game.name}</div>
                        <div class="card-meta">⭐ ${game.rating}</div>
                    </div>
                </div>`).join('')}
        </div>
        <div style="text-align:center;margin:2rem 0">
            <button class="btn-primary" onclick="loadMoreCheck()">عرض المزيد</button>
        </div>`;
    sessionStorage.removeItem('savedCheck');
}
 
async function loadMoreCheck() {
    checkPage++;
    const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&ordering=-rating&platforms=${getPlatformId(currentPlatform)}&page=${checkPage}`);
    const data = await response.json();
    const grid = document.getElementById('check-results-grid');
    data.results.forEach(game => {
        grid.innerHTML += `
            <div class="game-card" onclick="location.href='game.html?id=${game.id}'">
                <img class="card-img" src="${game.background_image}" alt="${game.name}">
                <div class="card-info">
                    <div class="card-title">${game.name}</div>
                    <div class="card-meta">⭐ ${game.rating}</div>
                </div>
            </div>`;
    });
}

function getPlatformId(platform) {
    const ids = {
        'pc': 4,
        'mac': 5,
        'ios': 3,
        'android': 21,
        'playstation': 187,
        'xbox': 186
    };
    return ids[platform] || 4;
}

const searchInput = document.querySelector('.search-wrap input');
const suggestionsBox = document.createElement('div');
suggestionsBox.className = 'suggestions';
searchInput.parentElement.appendChild(suggestionsBox);
 
searchInput.addEventListener('keypress', async function (e) {
    if (e.key === 'Enter') {
        suggestionsBox.innerHTML = '';
        const query = this.value;
        const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=20`);
        const data = await response.json();
        const grid = document.getElementById('games-grid');
        if (!grid) {
            location.href = `games.html?search=${query}`;
            return;
        }
        grid.innerHTML = '';
        data.results.forEach(game => {
            grid.innerHTML += `
                <div class="game-card" onclick="location.href='game.html?id=${game.id}'">
                    <img class="card-img" src="${game.background_image}" alt="${game.name}">
                    <div class="card-info">
                        <div class="card-title">${game.name}</div>
                        <div class="card-meta">⭐ ${game.rating} · ${game.released}</div>
                    </div>
                </div>`;
        });
    }
});
 
searchInput.addEventListener('input', async function () {
    const query = this.value;
    if (query.length < 2) {
        suggestionsBox.innerHTML = '';
        return;
    }
    const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=5`);
    const data = await response.json();
    suggestionsBox.innerHTML = '';
    data.results.forEach(game => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = game.name;
        item.onclick = () => {
            location.href = `game.html?id=${game.id}`;
        };
        suggestionsBox.appendChild(item);
    });
});
 
document.addEventListener('click', function (e) {
    if (!searchInput.parentElement.contains(e.target)) {
        suggestionsBox.innerHTML = '';
    }
});

function toggleFavorite(id, name, image, rating) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const exists = favorites.find(g => g.id === id);
    if (exists) {
        favorites = favorites.filter(g => g.id !== id);
    } else {
        favorites.push({ id, name, image, rating });
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}
 
function isFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.find(g => g.id === id);
}
 
if (document.getElementById('favorites-grid')) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const grid = document.getElementById('favorites-grid');
    if (favorites.length === 0) {
        grid.innerHTML = `<p style="color:#888;padding:2rem">مفيش ألعاب في المفضلة لسه!</p>`;
    } else {
        favorites.forEach(game => {
            grid.innerHTML += `
                <div class="game-card">
                    <img class="card-img" src="${game.image}" alt="${game.name}" onclick="location.href='game.html?id=${game.id}'">
                    <button class="fav-btn active" style="opacity:1"
                        onclick="event.stopPropagation(); toggleFavorite(${game.id},'${game.name}','${game.image}',${game.rating}); this.closest('.game-card').remove()">
                        <i class="fa-solid fa-star"></i>
                    </button>
                    <div class="card-info" onclick="location.href='game.html?id=${game.id}'">
                        <div class="card-title">${game.name}</div>
                        <div class="card-meta">⭐ ${game.rating}</div>
                    </div>
                </div>`;
        });
    }
}

async function getNews() {
    const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&page_size=20&ordering=-released&dates=2024-01-01,2026-12-31`);
    const data = await response.json();
    const grid = document.getElementById('news-grid');
    data.results.forEach(game => {
        grid.innerHTML += `
            <div class="news-card" onclick="location.href='game.html?id=${game.id}'">
                <img src="${game.background_image}" alt="${game.name}">
                <div class="news-info">
                    <span class="news-badge">🔥 جديد</span>
                    <div class="news-title">${game.name}</div>
                    <div class="news-date">📅 ${game.released}</div>
                </div>
            </div>`;
    });
}
 
if (document.getElementById('news-grid')) {
    getNews();
}