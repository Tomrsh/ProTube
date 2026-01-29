// server.js - RENDER KE LIYE
const express = require('express');
const ytSearch = require('yt-search');
const cors = require('cors');
const NodeCache = require('node-cache');
const app = express();

// ULTRA FAST CACHE - 10 minutes
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

app.use(cors());
app.use(express.json({ limit: '10kb' }));

// SINGLE OPTIMIZED ENDPOINT
app.get('/api/search', async (req, res) => {
    try {
        const startTime = Date.now();
        const query = (req.query.q || 'trending').trim().toLowerCase();
        const isDataSaver = req.query.ds === 'true';
        
        // CACHE CHECK - INSTANT RESPONSE
        const cacheKey = `${query}_${isDataSaver}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log(`CACHE HIT: ${query} - ${Date.now() - startTime}ms`);
            return res.json(cached);
        }
        
        // PARALLEL SEARCH FOR FASTER RESULTS
        const searchPromise = ytSearch(query);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 4000)
        );
        
        const r = await Promise.race([searchPromise, timeoutPromise]);
        
        if (!r?.videos?.length) {
            // FALLBACK TO TRENDING
            const fallback = await ytSearch('trending');
            const videos = fallback.videos.slice(0, isDataSaver ? 12 : 24);
            return res.json(videos.map(optimizeVideo));
        }
        
        // OPTIMIZED DATA - MINIMAL PAYLOAD
        const results = r.videos.slice(0, isDataSaver ? 15 : 30).map(v => ({
            i: v.videoId, // compressed key
            t: v.title.substring(0, 80), // max 80 chars
            h: isDataSaver ? 
                v.thumbnail.replace('hqdefault', 'mqdefault') : 
                v.thumbnail.replace('hqdefault', 'sddefault'),
            d: v.timestamp || '',
            v: v.views || ''
        }));
        
        // SET CACHE
        cache.set(cacheKey, results);
        console.log(`FRESH FETCH: ${query} - ${Date.now() - startTime}ms`);
        
        res.json(results);
        
    } catch (error) {
        console.error('Search error:', error.message);
        // RETURN EMPTY ARRAY INSTEAD OF ERROR
        res.json([]);
    }
});

function optimizeVideo(v) {
    return {
        i: v.videoId,
        t: v.title.substring(0, 80),
        h: v.thumbnail,
        d: v.timestamp || '',
        v: v.views || ''
    };
}

// HEALTH CHECK
app.get('/ping', (req, res) => {
    res.send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 ULTRA-FAST API on ${PORT}`));
