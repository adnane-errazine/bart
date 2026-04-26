import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services import dataset, db, rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. In-memory dataset from CSV
    ds = dataset.init()
    print(f"✓ Dataset: {len(ds.artworks)} artworks, {len(ds.sales)} sales, {len(ds.artists)} artists")

    # 2. SQLite for conversation history
    await db.init_db()
    print("✓ SQLite ready")

    # 3. Qdrant status (non-blocking — keyword fallback active if empty/down)
    try:
        count = await rag.artworks_indexed()
        if count > 0:
            print(f"✓ Qdrant: {count} vectors ready (semantic search active)")
        else:
            print("⚠  Qdrant empty — run: python -m services.indexer")
    except Exception as e:
        print(f"⚠  Qdrant unavailable ({e}) — keyword fallback active")

    yield


app = FastAPI(title="BART API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.v1 import artworks, sales, indices, chat, artists, signals

app.include_router(artworks.router, prefix="/api/v1")
app.include_router(sales.router, prefix="/api/v1")
app.include_router(indices.router, prefix="/api/v1")
app.include_router(artists.router, prefix="/api/v1")
app.include_router(signals.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/health")
async def health():
    ds = dataset.get()
    try:
        qdrant_count = await rag.artworks_indexed()
    except Exception:
        qdrant_count = -1
    return {
        "status": "ok",
        "artworks": len(ds.artworks),
        "sales": len(ds.sales),
        "artists": len(ds.artists),
        "qdrant_vectors": qdrant_count,
        "semantic_search": qdrant_count > 0,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
