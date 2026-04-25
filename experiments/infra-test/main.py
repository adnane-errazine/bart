import os
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from pathlib import Path

import asyncpg
import anthropic as anthropic_sdk
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from pyngrok import ngrok, conf
from dotenv import load_dotenv

# Load .env from project root (two levels up from experiments/infra-test/)
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

CLAUDE_API_KEY  = os.environ["CLAUDE_API_KEY"]
QDRANT_API_KEY  = os.environ["QDRANT_API_KEY"]
QDRANT_URL      = os.environ["QDRANT_URL"]
SUPABASE_URL    = os.environ["SUPABASE_URL"]
OPENAI_API_KEY  = os.environ["OPENAI_API_KEY"]
NGROK_AUTHTOKEN = os.environ["NGROK_AUTHTOKEN"]

PORT = 8001


@asynccontextmanager
async def lifespan(app: FastAPI):
    conf.get_default().auth_token = NGROK_AUTHTOKEN
    conf.get_default().ngrok_path = "/usr/local/bin/ngrok"
    tunnel = ngrok.connect(PORT, "http")
    print("\n" + "═" * 52)
    print("  BART — Infrastructure Test")
    print(f"  Local  → http://localhost:{PORT}")
    print(f"  Public → {tunnel.public_url}")
    print(f"  Health → {tunnel.public_url}/health")
    print("═" * 52 + "\n")
    yield
    ngrok.disconnect(tunnel.public_url)


app = FastAPI(title="BART infra test", lifespan=lifespan)


@app.get("/")
async def root():
    return {"status": "ok", "service": "BART infra-test", "message": "All systems nominal — hit /health to run checks."}


@app.get("/health")
async def health():
    results = {}

    # ── Supabase (session pooler — IPv4) ─────────────────────────
    try:
        conn = await asyncpg.connect(SUPABASE_URL, timeout=8)
        val = await conn.fetchval("SELECT 1")
        await conn.close()
        results["supabase"] = {"status": "ok", "ping": val}
    except Exception as e:
        results["supabase"] = {"status": "error", "detail": str(e)}

    # ── Qdrant Cloud ─────────────────────────────────────────────
    try:
        qdrant = AsyncQdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=8)
        info = await qdrant.get_collections()
        collections = [c.name for c in info.collections]
        await qdrant.close()
        results["qdrant"] = {"status": "ok", "collections": collections}
    except Exception as e:
        results["qdrant"] = {"status": "error", "detail": str(e)}

    # ── OpenAI (embeddings) ───────────────────────────────────────
    try:
        oai = AsyncOpenAI(api_key=OPENAI_API_KEY)
        r = await oai.embeddings.create(model="text-embedding-3-small", input="BART infra test")
        dims = len(r.data[0].embedding)
        results["openai"] = {"status": "ok", "model": "text-embedding-3-small", "dims": dims}
    except Exception as e:
        results["openai"] = {"status": "error", "detail": str(e)}

    # ── Anthropic (Claude) ────────────────────────────────────────
    try:
        client = anthropic_sdk.AsyncAnthropic(api_key=CLAUDE_API_KEY)
        msg = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=16,
            messages=[{"role": "user", "content": "Reply with exactly: BART online"}],
        )
        results["anthropic"] = {"status": "ok", "response": msg.content[0].text.strip()}
    except Exception as e:
        results["anthropic"] = {"status": "error", "detail": str(e)}

    all_ok = all(v["status"] == "ok" for v in results.values())
    status_code = 200 if all_ok else 207

    return JSONResponse(
        status_code=status_code,
        content={
            "all_systems": "✓ go" if all_ok else "✗ issues detected",
            "checks": results,
        },
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
