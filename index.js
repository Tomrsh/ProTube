const express = require('express');
const ytSearch = require('yt-search');
const app = express();
const PORT = 3000;

// Data Saving Logic: Server side par content filter karta hai
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'trending';
        const isDataSaver = req.query.ds === 'true';
        
        const r = await ytSearch(query);
        
        // Data Saver on hone par kam results aur low-res thumbnails bhejta hai
        const limit = isDataSaver ? 12 : 24;
        const results = r.videos.slice(0, limit).map(v => ({
            videoId: v.videoId,
            title: v.title,
            // Data Saver: hqdefault ko mqdefault se replace karta hai
            thumbnail: isDataSaver ? v.thumbnail.replace('hqdefault', 'mqdefault') : v.thumbnail
        }));
        
        res.json(results);
    } catch (e) {
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Backend Live at http://localhost:${PORT}`));
