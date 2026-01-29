const express = require('express');
const ytSearch = require('yt-search');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Search API - Tumhara original code improved
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'trending';
        const isDataSaver = req.query.ds === 'true';
        
        const r = await ytSearch(query);
        if (!r || !r.videos) return res.json([]);

        const limit = isDataSaver ? 15 : 30;
        const results = r.videos.slice(0, limit).map(v => ({
            videoId: v.videoId,
            title: v.title,
            thumbnail: isDataSaver ? 
                v.thumbnail.replace('hqdefault', 'mqdefault') : 
                v.thumbnail,
            timestamp: v.timestamp,
            views: v.views,
            duration: v.duration ? v.duration.toString() : ''
        }));
        
        res.json(results);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Search failed" });
    }
});

// Trending videos
app.get('/api/trending', async (req, res) => {
    try {
        const r = await ytSearch('trending');
        const results = r.videos.slice(0, 30).map(v => ({
            videoId: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            timestamp: v.timestamp,
            views: v.views
        }));
        res.json(results);
    } catch (e) {
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
