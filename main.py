from fastapi import FastAPI, HTTPException
from yt_dlp import YoutubeDL

app = FastAPI()

@app.get("/")
def home():
    return {"message": "YouTube Downloader API is Running!"}

@app.get("/download")
def get_download_link(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            download_url = info.get('url')
            title = info.get('title')
            thumbnail = info.get('thumbnail')

            return {
                "status": "success",
                "title": title,
                "thumbnail": thumbnail,
                "download_link": download_url
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

