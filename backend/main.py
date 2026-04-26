import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services import dataset


@asynccontextmanager
async def lifespan(app: FastAPI):
    ds = dataset.init()
    print(f"✓ Dataset loaded: {len(ds.artworks)} artworks, {len(ds.sales)} sales, {len(ds.artists)} artists")
    yield


app = FastAPI(title="BART API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.v1 import artworks, sales, indices, chat, artists

app.include_router(artworks.router, prefix="/api/v1")
app.include_router(sales.router, prefix="/api/v1")
app.include_router(indices.router, prefix="/api/v1")
app.include_router(artists.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/health")
async def health():
    ds = dataset.get()
    return {
        "status": "ok",
        "service": "BART",
        "artworks": len(ds.artworks),
        "sales": len(ds.sales),
        "artists": len(ds.artists),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
