const express = require('express');
const ytSearch = require('yt-search');
const app = express();
const PORT = 3000;

const html = `
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>ProTube Premium</title>
    <style>
        :root { --red: #ff0000; --bg: #000; --surface: #0f0f0f; --border: #222; }
        * { -webkit-tap-highlight-color: transparent; user-select: none; box-sizing: border-box; outline: none; margin: 0; padding: 0; }
        body { background: var(--bg); color: #fff; font-family: 'Segoe UI', Roboto, sans-serif; overflow-x: hidden; }

        /* Header */
        header { 
            background: rgba(0,0,0,0.95); padding: 10px 15px; display: flex; align-items: center; 
            position: sticky; top: 0; z-index: 2000; border-bottom: 1px solid var(--border); gap: 10px;
            backdrop-filter: blur(10px);
        }
        .logo { font-size: 20px; font-weight: 900; color: var(--red); cursor: pointer; white-space: nowrap; }
        .logo span { color: #fff; }
        .search-container { flex: 1; }
        .search-box { background: #1a1a1a; border-radius: 25px; display: flex; padding: 7px 15px; border: 1px solid #333; }
        #sq { background: none; border: none; color: #fff; width: 100%; font-size: 14px; user-select: text; }

        /* Sidebar */
        .sidebar { position: fixed; left: -280px; top: 0; width: 280px; height: 100%; background: #000; z-index: 5000; transition: 0.3s; border-right: 1px solid var(--border); overflow-y: auto; }
        .sidebar.active { left: 0; }
        .menu-item { padding: 18px 20px; border-bottom: 1px solid #111; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; }
        #side-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none; z-index: 4000; }

        /* Loader */
        #loader { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; }
        .spinner { width: 45px; height: 45px; border: 4px solid #222; border-top: 4px solid var(--red); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Grid & Cards */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; padding: 15px; }
        .v-card { background: var(--surface); border-radius: 12px; overflow: hidden; border: 1px solid var(--border); transition: 0.3s; }
        .v-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
        .v-title { padding: 10px; font-size: 13px; font-weight: 500; height: 46px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; color: #eee; }

        /* Full Player Layer */
        #player-page { position: fixed; inset: 0; background: #000; z-index: 6000; display: none; overflow-y: auto; }
        .video-sticky { width: 100%; aspect-ratio: 16/9; position: sticky; top: 0; z-index: 6500; background: #000; }
        .close-btn { position: absolute; top: 12px; left: 12px; z-index: 7000; background: rgba(0,0,0,0.6); color: #fff; border-radius: 50%; width: 36px; height: 36px; border: none; font-size: 20px; display: flex; align-items: center; justify-content: center; }

        /* History & Toggle */
        .hist-card { display: flex; gap: 10px; padding: 12px; border-bottom: 1px solid #111; position: relative; }
        .hist-card img { width: 90px; aspect-ratio: 16/9; border-radius: 6px; object-fit: cover; }
        .hist-del { color: var(--red); font-size: 20px; padding: 5px; position: absolute; right: 10px; bottom: 8px; }
        .switch { width: 38px; height: 20px; background: #333; border-radius: 12px; position: relative; }
        .switch.on { background: var(--red); }
        .switch::after { content:''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: 0.2s; }
        .switch.on::after { left: 20px; }
    </style>
</head>
<body>

    <div id="side-overlay" onclick="toggleSB(false)"></div>
    <div id="loader"><div class="spinner"></div></div>
    
    <div class="sidebar" id="sb">
        <div style="padding: 25px 20px; font-size: 22px; font-weight: 900; color: var(--red); border-bottom: 1px solid var(--border);">Pro<span>Tube</span></div>
        <div class="menu-item" onclick="toggleDS()">Ultra Data Saver <div class="switch" id="ds-toggle"></div></div>
        <div style="padding: 10px 20px; font-size: 12px; color: #555;">HISTORY</div>
        <div id="h-list"></div>
    </div>

    <header>
        <div onclick="toggleSB(true)" style="font-size:24px; cursor:pointer; padding: 0 5px;">☰</div>
        <div class="logo" onclick="location.reload()">Pro<span>Tube</span></div>
        <div class="search-container">
            <div class="search-box">
                <input type="text" id="sq" placeholder="Search..." onkeyup="if(event.key==='Enter') startSearch()">
            </div>
        </div>
    </header>

    <div id="home-feed" class="grid"></div>

    <div id="player-page">
        <button class="close-btn" onclick="history.back()">✕</button>
        <div class="video-sticky">
            <iframe id="main-v" width="100%" height="100%" frameborder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                allowfullscreen>
            </iframe>
        </div>
        <div id="v-info" style="padding:18px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #111;"></div>
        <div style="padding:15px; font-size:12px; color:var(--red); font-weight:bold;">RELATED CONTENT</div>
        <div id="rel-grid" class="grid"></div>
    </div>

    <script>
        let isDS = localStorage.getItem('pro_ds') === 'true';
        if(isDS) document.getElementById('ds-toggle').classList.add('on');

        // SINGLE BACK BUTTON FIX
        window.onpopstate = function() {
            if (document.getElementById('player-page').style.display === 'block') {
                closePlayerUI();
            }
            toggleSB(false);
        };

        function toggleSB(show) {
            document.getElementById('sb').classList.toggle('active', show);
            document.getElementById('side-overlay').style.display = show ? 'block' : 'none';
        }

        async function startSearch(q) {
            const query = q || document.getElementById('sq').value;
            if(!query) return;
            toggleSB(false);
            document.getElementById('loader').style.display = 'block';
            try {
                const res = await fetch('/api/search?q=' + encodeURIComponent(query));
                const data = await res.json();
                renderFeed('home-feed', data);
                localStorage.setItem('last_search', query);
                window.scrollTo(0,0);
            } finally {
                document.getElementById('loader').style.display = 'none';
            }
        }

        function renderFeed(id, data) {
            document.getElementById(id).innerHTML = data.map(v => \`
                <div class="v-card" onclick="openPlayer('\${v.videoId}', '\${v.title.replace(/'/g, "")}', '\${v.thumbnail}')">
                    <img src="\${isDS ? v.thumbnail.replace('hqdefault', 'mqdefault') : v.thumbnail}">
                    <div class="v-title">\${v.title}</div>
                </div>\`).join('');
        }

        async function openPlayer(id, title, thumb) {
            // Push ONE state for single back navigation
            history.pushState({player: true}, '');
            
            document.getElementById('player-page').style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // COUNTRY RESTRICTION & REDIRECT FIX
            const q = isDS ? 'small' : 'hd1080';
            const embedUrl = "https://www.youtube.com/embed/" + id + 
                             "?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3" +
                             "&enablejsapi=1&origin=" + window.location.origin;

            document.getElementById('main-v').src = embedUrl;
            document.getElementById('v-info').innerText = title;

            saveHistory(id, title, thumb);
            
            const res = await fetch('/api/search?q=' + encodeURIComponent(title));
            const data = await res.json();
            renderFeed('rel-grid', data);
        }

        function closePlayerUI() {
            document.getElementById('player-page').style.display = 'none';
            document.getElementById('main-v').src = '';
            document.body.style.overflow = 'auto';
        }

        function toggleDS() {
            localStorage.setItem('pro_ds', !isDS);
            location.reload();
        }

        function saveHistory(id, title, thumb) {
            let h = JSON.parse(localStorage.getItem('pro_h')) || [];
            h = h.filter(x => x.id !== id);
            h.unshift({id, title, thumb});
            localStorage.setItem('pro_h', JSON.stringify(h.slice(0, 20)));
            loadHistory();
        }

        function loadHistory() {
            const h = JSON.parse(localStorage.getItem('pro_h')) || [];
            document.getElementById('h-list').innerHTML = h.map(i => \`
                <div class="hist-card">
                    <img src="\${i.thumb}" onclick="openPlayer('\${i.id}', '\${i.title}', '\${i.thumb}')">
                    <div style="font-size:11px; flex:1;" onclick="openPlayer('\${i.id}', '\${i.title}', '\${i.thumb}')">\${i.title.substring(0,35)}...</div>
                    <div class="hist-del" onclick="deleteHistory('\${i.id}')">🗑</div>
                </div>\`).join('');
        }

        function deleteHistory(id) {
            let h = JSON.parse(localStorage.getItem('pro_h')) || [];
            localStorage.setItem('pro_h', JSON.stringify(h.filter(x => x.id !== id)));
            loadHistory();
        }

        window.onload = () => {
            const ls = localStorage.getItem('last_search') || 'trending';
            startSearch(ls);
            loadHistory();
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(html));

app.get('/api/search', async (req, res) => {
    try {
        const r = await ytSearch({ query: req.query.q || 'trending', pages: 1 });
        res.json(r.videos.slice(0, 24).map(v => ({ videoId: v.videoId, title: v.title, thumbnail: v.thumbnail })));
    } catch (e) { res.json([]); }
});

app.listen(PORT, () => console.log('✅ ProTube Premium Full Update Live!'));
