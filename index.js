const express = require('express');
const ytSearch = require('yt-search');
const cors = require('cors'); // Alag domain se connect karne ke liye zaroori hai
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Isse aapki HTML file API se connect ho payegi

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'trending';
        const isDataSaver = req.query.ds === 'true';
        
        const r = await ytSearch(query);
        const limit = isDataSaver ? 12 : 24;
        
        const results = r.videos.slice(0, limit).map(v => ({
            videoId: v.videoId,
            title: v.title,
            // Data Saver: High-res ko Medium-res thumbnails se replace karta hai
            thumbnail: isDataSaver ? v.thumbnail.replace('hqdefault', 'mqdefault') : v.thumbnail
        }));
        
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: "Search failed" });
    }
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
