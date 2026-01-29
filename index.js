const express = require('express');
const ytSearch = require('yt-search');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Search API (No suggestions logic here)
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'trending';
        const isDataSaver = req.query.ds === 'true';
        
        const r = await ytSearch(query);
        if (!r || !r.videos) return res.json([]);

        const limit = isDataSaver ? 15 : 30; // Data saver on hone par kam content
        const results = r.videos.slice(0, limit).map(v => ({
            videoId: v.videoId,
            title: v.title,
            // MQ Thumbnail saves ~50% more data than HQ
            thumbnail: isDataSaver ? v.thumbnail.replace('hqdefault', 'mqdefault') : v.thumbnail,
            timestamp: v.timestamp
        }));
        
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: "Search logic failed" });
    }
});

app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
