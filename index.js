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
    <title>ProTube Shield</title>
    <style>
        :root { --red: #ff0000; --bg: #0f0f0f; --surface: #1a1a1a; --border: #2a2a2a; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; margin: 0; padding: 0; outline: none; }
        body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }

        header { 
            background: #000; padding: 10px 15px; display: flex; align-items: center; 
            position: sticky; top: 0; z-index: 2000; border-bottom: 1px solid var(--border); gap: 12px;
        }
        .menu-icon { font-size: 24px; cursor: pointer; }
        .logo { font-size: 20px; font-weight: 900; color: var(--red); }
        .logo span { color: #fff; }

        .search-wrapper { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box { width: 100%; background: #121212; border-radius: 20px; display: flex; padding: 7px 15px; border: 1px solid #333; }
        #sq { background: none; border: none; color: #fff; width: 100%; font-size: 15px; }
        #clear-search { display: none; position: absolute; right: 10px; color: #fff; cursor: pointer; background: #444; border-radius: 50%; width: 22px; height: 22px; text-align: center; line-height: 22px; font-size: 12px; }

        .sidebar { position: fixed; left: -280px; top: 0; width: 280px; height: 100%; background: #000; z-index: 5000; transition: 0.3s; border-right: 1px solid var(--border); padding: 20px; overflow-y: auto; }
        .sidebar.active { left: 0; }
        #overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; z-index: 4000; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; padding: 15px; }
        @media (max-width: 600px) { .grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); } }

        .v-card { cursor: pointer; }
        .v-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 12px; }
        .v-title { padding: 8px 0; font-size: 13px; height: 42px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; }

        /* PLAYER & SHIELD SYSTEM */
        #player-page { position: fixed; inset: 0; background: #000; z-index: 6000; display: none; overflow-y: auto; }
        .video-box { width: 100%; aspect-ratio: 16/9; position: sticky; top: 0; background: #000; z-index: 6500; }
        iframe { width: 100%; height: 100%; border: none; }

        /* THE SHIELD: Blocks Youtube Logo and Links but allows Controls */
        .shield-layer { position: absolute; inset: 0; z-index: 6550; pointer-events: none; }
        .shield-blocker { position: absolute; pointer-events: all; cursor: default; background: transparent; }
        .b-logo { bottom: 0; left: 0; width: 85px; height: 50px; } /* Blocks YouTube Logo */
        .b-top { top: 0; right: 0; width: 200px; height: 60px; } /* Blocks "Watch on YouTube" / Links */
        .b-bottom-right { bottom: 0; right: 80px; width: 150px; height: 40px; } /* Blocks other redirect icons */

        .close-btn { position: absolute; top: 12px; left: 12px; z-index: 7000; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    </style>
</head>
<body>

    <div id="overlay" onclick="toggleSB(false)"></div>
    <div id="loader" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; border:3px solid #222; border-top:3px solid var(--red); border-radius:50%; width:35px; height:35px; animation:spin 0.8s linear infinite;"></div>
    
    <div class="sidebar" id="sb">
        <div class="logo">PRO<span>TUBE</span></div>
        <div style="margin-top:20px; font-size:12px; color:#666;">HISTORY</div>
        <div id="history-list"></div>
    </div>

    <header>
        <div class="menu-icon" onclick="toggleSB(true)">☰</div>
        <div class="logo">PRO<span>TUBE</span></div>
        <div class="search-wrapper">
            <div class="search-box">
                <input type="text" id="sq" placeholder="Search..." oninput="updateSearchUI()" onkeyup="if(event.key==='Enter') startSearch()">
                <div id="search-icon" style="position:absolute; right:12px; color:#888;">🔍</div>
                <div id="clear-search" onclick="clearInput()">✕</div>
            </div>
        </div>
    </header>

    <div id="home-feed" class="grid"></div>

    <div id="player-page">
        <button class="close-btn" onclick="history.back()">✕</button>
        <div class="video-box">
            <iframe id="main-v" allow="autoplay; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms" allowfullscreen></iframe>
            <div class="shield-layer">
                <div class="shield-blocker b-logo"></div>
                <div class="shield-blocker b-top"></div>
                <div class="shield-blocker b-bottom-right"></div>
            </div>
        </div>
        <div style="padding: 15px; font-weight: bold; color: var(--red);">RECOMMENDED FOR YOU</div>
        <div id="rel-grid" class="grid"></div>
    </div>

    <script>
        function toggleSB(s) {
            document.getElementById('sb').classList.toggle('active', s);
            document.getElementById('overlay').style.display = s ? 'block' : 'none';
        }

        function updateSearchUI() {
            const val = document.getElementById('sq').value;
            document.getElementById('clear-search').style.display = val.length > 0 ? 'block' : 'none';
            document.getElementById('search-icon').style.display = val.length > 0 ? 'none' : 'block';
        }

        function clearInput() {
            document.getElementById('sq').value = '';
            updateSearchUI();
            document.getElementById('sq').focus();
        }

        window.onpopstate = () => {
            if(document.getElementById('player-page').style.display === 'block') {
                document.getElementById('player-page').style.display = 'none';
                document.getElementById('main-v').src = '';
                document.body.style.overflow = 'auto';
            }
        };

        async function startSearch(q) {
            const query = q || document.getElementById('sq').value;
            if(!query) return;
            document.getElementById('loader').style.display = 'block';
            try {
                const res = await fetch('/api/search?q=' + encodeURIComponent(query));
                const data = await res.json();
                renderFeed('home-feed', data);
            } finally {
                document.getElementById('loader').style.display = 'none';
            }
        }

        function renderFeed(id, data) {
            document.getElementById(id).innerHTML = data.map(v => \`
                <div class="v-card" onclick="openPlayer('\${v.videoId}', '\${v.title.replace(/'/g, "")}', '\${v.thumbnail}')">
                    <img src="\${v.thumbnail}">
                    <div class="v-title">\${v.title}</div>
                </div>\`).join('');
        }

        function openPlayer(id, title, thumb) {
            if(!history.state || !history.state.player) history.pushState({player: true}, '');
            document.getElementById('player-page').style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Fixed URL + Sandbox
            document.getElementById('main-v').src = "https://www.youtube.com/embed/" + id + "?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1";
            
            saveH(id, title, thumb);
            fetchRel(title);
        }

        async function fetchRel(title) {
            const res = await fetch('/api/search?q=' + encodeURIComponent(title));
            const data = await res.json();
            renderFeed('rel-grid', data);
        }

        function saveH(id, t, im) {
            let h = JSON.parse(localStorage.getItem('my_h')) || [];
            h = h.filter(x => x.id !== id);
            h.unshift({id, t, im});
            localStorage.setItem('my_h', JSON.stringify(h.slice(0, 15)));
            loadH();
        }

        function loadH() {
            const h = JSON.parse(localStorage.getItem('my_h')) || [];
            document.getElementById('history-list').innerHTML = h.map(x => \`
                <div style="display:flex; gap:10px; margin-top:12px; cursor:pointer;" onclick="openPlayer('\${x.id}', '\${x.t.replace(/'/g, "")}', '\${x.im}')">
                    <img src="\${x.im}" style="width:80px; border-radius:6px;">
                    <div style="font-size:11px; color:#ccc;">\${x.t.substring(0,30)}...</div>
                </div>\`).join('');
        }

        window.onload = () => { startSearch('trending movies'); loadH(); };
    </script>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
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

app.listen(PORT, () => console.log('✅ Sab Kuch Fix! No Redirects!'));
