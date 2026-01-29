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
        * { -webkit-tap-highlight-color: transparent; user-select: none; box-sizing: border-box; outline: none; }
        body { background: var(--bg); color: #fff; font-family: sans-serif; margin: 0; overflow-x: hidden; }

        header { 
            background: #000; padding: 10px 15px; display: flex; align-items: center; 
            position: sticky; top: 0; z-index: 2000; border-bottom: 1px solid var(--border); gap: 10px;
        }
        .logo { font-size: 20px; font-weight: 900; color: var(--red); cursor: pointer; white-space: nowrap; }
        .logo span { color: #fff; }
        
        .search-container { flex: 1; position: relative; }
        .search-box { background: #1a1a1a; border-radius: 25px; display: flex; padding: 7px 15px; border: 1px solid #333; }
        #sq { background: none; border: none; color: #fff; width: 100%; font-size: 14px; user-select: text; }

        .sidebar { position: fixed; left: -280px; top: 0; width: 280px; height: 100%; background: #000; z-index: 5000; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-right: 1px solid var(--border); overflow-y: auto; }
        .sidebar.active { left: 0; }
        .menu-item { padding: 18px 20px; border-bottom: 1px solid #111; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 15px; }
        #side-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none; z-index: 4000; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; padding: 12px; }
        .v-card { background: var(--surface); border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
        .v-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
        .v-title { padding: 12px; font-size: 14px; font-weight: 500; height: 45px; overflow: hidden; line-height: 1.4; }

        #player-page, #policy-page { position: fixed; inset: 0; background: #000; z-index: 6000; display: none; overflow-y: auto; }
        .video-sticky { width: 100%; aspect-ratio: 16/9; position: sticky; top: 0; z-index: 100; background: #000; }
        .close-btn { position: absolute; top: 15px; left: 15px; z-index: 7000; background: rgba(0,0,0,0.6); color: #fff; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border:none; font-size: 20px; }

        .hist-card { display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid #111; position: relative; }
        .hist-card img { width: 80px; aspect-ratio: 16/9; border-radius: 4px; object-fit: cover; }
        .hist-del { color: var(--red); font-size: 18px; padding: 5px; position: absolute; right: 10px; bottom: 10px; }

        .switch { width: 34px; height: 18px; background: #333; border-radius: 10px; position: relative; }
        .switch.on { background: var(--red); }
        .switch::after { content:''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: 0.2s; }
        .switch.on::after { left: 18px; }
    </style>
</head>
<body>

    <div id="side-overlay" onclick="toggleSB(false)"></div>
    
    <div class="sidebar" id="sb">
        <div style="padding: 25px 20px; font-size: 20px; font-weight: 900; color: var(--red); border-bottom: 1px solid var(--border);">Pro<span>Tube</span></div>
        <div class="menu-item" onclick="toggleDataSaver()">
            Ultra Data Saver
            <div class="switch" id="ds-toggle"></div>
        </div>
        <div class="menu-item" onclick="openPolicy()">📜 Privacy Policy</div>
        <div style="padding: 15px; font-size: 12px; color: #555;">HISTORY</div>
        <div id="h-list"></div>
    </div>

    <header>
        <div onclick="event.stopPropagation(); toggleSB(true)" style="font-size:24px; cursor:pointer;">☰</div>
        <div class="logo" onclick="location.href='/'">Pro<span>Tube</span></div>
        <div class="search-container" onclick="event.stopPropagation()">
            <div class="search-box">
                <input type="text" id="sq" placeholder="Search..." autocomplete="off" onkeyup="if(event.key==='Enter') startSearch()">
            </div>
        </div>
    </header>

    <div id="home-feed" class="grid"></div>

    <div id="player-page">
        <button class="close-btn" onclick="closePlayer()">✕</button>
        <div class="video-sticky">
            <iframe id="main-v" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
        <div id="v-info" style="padding:15px; font-weight:bold; border-bottom:1px solid #111;"></div>
        <div style="padding:15px; font-size:14px; color:var(--red); font-weight:bold;">RELATED VIDEOS</div>
        <div id="rel-grid" class="grid"></div>
    </div>

    <div id="policy-page">
        <button class="close-btn" onclick="closePolicy()">✕</button>
        <div style="padding:80px 20px 20px;">
            <h1 style="color:var(--red);">Privacy Policy</h1>
            <p>ProTube Premium aapka koi bhi personal data collect nahi karta. Search history aapke device par hi rehti hai. Hum asli quality aur data bachat par focus karte hain.</p>
        </div>
    </div>

    <script>
        let isDS = localStorage.getItem('pro_ds') === 'true';
        if(isDS) document.getElementById('ds-toggle').classList.add('on');

        window.onpopstate = () => { closePlayer(); closePolicy(); toggleSB(false); };

        function toggleSB(show) {
            const sb = document.getElementById('sb');
            const ov = document.getElementById('side-overlay');
            sb.classList.toggle('active', show);
            ov.style.display = show ? 'block' : 'none';
        }

        async function startSearch(q) {
            const query = q || document.getElementById('sq').value;
            if(!query) return;
            document.getElementById('sq').value = query;

            const res = await fetch('/api/search?q=' + encodeURIComponent(query));
            const data = await res.json();
            renderFeed('home-feed', data);
            localStorage.setItem('last_search', query);
        }

        function renderFeed(id, data) {
            document.getElementById(id).innerHTML = data.map(v => \`
                <div class="v-card" onclick="openPlayer('\${v.videoId}', '\${v.title}', '\${v.thumbnail}')">
                    <img src="\${isDS ? v.thumbnail.replace('hqdefault', 'mqdefault') : v.thumbnail}">
                    <div class="v-title">\${v.title}</div>
                </div>\`).join('');
        }

        async function openPlayer(id, title, thumb) {
            history.pushState({p:1}, '');
            document.getElementById('player-page').style.display = 'block';
            const q = isDS ? 'small' : 'hd1080';
            document.getElementById('main-v').src = \`https://www.youtube-nocookie.com/embed/\${id}?autoplay=1&modestbranding=1&rel=0&vq=\${q}\`;
            document.getElementById('v-info').innerText = title;

            const res = await fetch('/api/search?q=' + encodeURIComponent(title));
            const data = await res.json();
            renderFeed('rel-grid', data);
            
            saveHistory(id, title, thumb);
        }

        function toggleDataSaver() {
            isDS = !isDS;
            localStorage.setItem('pro_ds', isDS);
            document.getElementById('ds-toggle').classList.toggle('on');
            location.reload();
        }

        function saveHistory(id, title, thumb) {
            let h = JSON.parse(localStorage.getItem('pro_h')) || [];
            h = h.filter(x => x.id !== id);
            h.unshift({id, title, thumb});
            localStorage.setItem('pro_h', JSON.stringify(h.slice(0, 20)));
            loadHistory();
        }

        function deleteHistory(id) {
            let h = JSON.parse(localStorage.getItem('pro_h')) || [];
            h = h.filter(x => x.id !== id);
            localStorage.setItem('pro_h', JSON.stringify(h));
            loadHistory();
        }

        function loadHistory() {
            const h = JSON.parse(localStorage.getItem('pro_h')) || [];
            document.getElementById('h-list').innerHTML = h.map(i => \`
                <div class="hist-card">
                    <img src="\${i.thumb}" onclick="openPlayer('\${i.id}', '\${i.title}', '\${i.thumb}')">
                    <div style="font-size:12px;" onclick="openPlayer('\${i.id}', '\${i.title}', '\${i.thumb}')">\${i.title.substring(0,40)}...</div>
                    <div class="hist-del" onclick="deleteHistory('\${i.id}')">🗑</div>
                </div>\`).join('');
        }

        function closePlayer() { document.getElementById('player-page').style.display = 'none'; document.getElementById('main-v').src = ''; }
        function openPolicy() { document.getElementById('policy-page').style.display = 'block'; toggleSB(false); }
        function closePolicy() { document.getElementById('policy-page').style.display = 'none'; }

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
        const r = await ytSearch(req.query.q || 'trending');
        res.json(r.videos.slice(0, 24).map(v => ({ videoId: v.videoId, title: v.title, thumbnail: v.thumbnail })));
    } catch (e) { res.json([]); }
});

app.listen(PORT, () => console.log('✅ ProTube Premium Live (No Suggestions)!'));
