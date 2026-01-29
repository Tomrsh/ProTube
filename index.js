// server.js - RENDER DEPLOY KE LIYE
const express = require('express');
const ytSearch = require('yt-search');
const cors = require('cors');
const NodeCache = require('node-cache');
const app = express();

// ⚡ SUPER FAST CACHE (5MB memory)
const cache = new NodeCache({ 
    stdTTL: 300, // 5 minutes cache
    maxKeys: 500,
    checkperiod: 60 
});

app.use(cors());
app.use(express.json({ limit: '5kb' }));

// 🚀 SINGLE OPTIMIZED SEARCH ENDPOINT
app.get('/api/search', async (req, res) => {
    const start = Date.now();
    try {
        const query = (req.query.q || 'trending music').trim().substring(0, 100);
        const isDS = req.query.ds === 'true';
        
        // ⚡ INSTANT CACHE RESPONSE
        const cacheKey = `search_${query}_${isDS}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log(`⚡ CACHE: ${query} - ${Date.now() - start}ms`);
            return res.json(cached);
        }
        
        // 🔥 PARALLEL FETCHING
        const searchTasks = [
            ytSearch(query).catch(e => ({ videos: [] })),
            new Promise(r => setTimeout(() => r({ videos: [] }), 3000))
        ];
        
        const result = await Promise.race(searchTasks);
        const videos = result.videos || [];
        
        // 📦 OPTIMIZED DATA STRUCTURE
        const optimizedVideos = videos.slice(0, isDS ? 18 : 36).map(v => ({
            i: v.videoId,
            t: v.title.length > 70 ? v.title.substring(0, 70) + '...' : v.title,
            h: isDS ? 
                v.thumbnail.replace('hqdefault', 'mqdefault') : 
                v.thumbnail.replace('hqdefault', 'sddefault'),
            d: v.timestamp || '',
            v: v.views ? (v.views + ' views') : ''
        }));
        
        // 💾 SAVE TO CACHE
        cache.set(cacheKey, optimizedVideos);
        console.log(`✅ FRESH: ${query} - ${Date.now() - start}ms`);
        
        res.json(optimizedVideos);
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        res.json([]); // Never crash
    }
});

// 📺 TRENDING VIDEOS (Separate Cache)
app.get('/api/trending', async (req, res) => {
    const cacheKey = 'trending_' + (req.query.ds === 'true');
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
    
    const result = await ytSearch('trending today');
    const videos = result.videos.slice(0, 24).map(v => ({
        i: v.videoId,
        t: v.title.substring(0, 70),
        h: req.query.ds === 'true' ? 
            v.thumbnail.replace('hqdefault', 'mqdefault') : 
            v.thumbnail,
        d: v.timestamp || '',
        v: v.views || ''
    }));
    
    cache.set(cacheKey, videos);
    res.json(videos);
});

// 🩺 HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ 
        status: '🚀 ULTRA FAST', 
        cache: cache.getStats(),
        uptime: process.uptime() 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 API Running: http://localhost:${PORT}`));
