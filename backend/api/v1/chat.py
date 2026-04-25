import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db import get_db
import anthropic

router = APIRouter(tags=["chat"])

SYSTEM = (
    "You are BART, an AI research assistant specialized in the art market. "
    "Help collectors and investors understand art market trends, valuations, "
    "auction results, and investment opportunities. Be concise and data-driven."
)


class ChatRequest(BaseModel):
    message: str
    artwork_id: str | None = None


@router.post("/chat")
async def chat(req: ChatRequest, conn=Depends(get_db)):
    context = ""
    if req.artwork_id:
        row = await conn.fetchrow("SELECT * FROM artwork WHERE id = $1", req.artwork_id)
        if row:
            sales = await conn.fetch(
                "SELECT * FROM sale WHERE artwork_id = $1 ORDER BY sale_date",
                req.artwork_id,
            )
            context = (
                f"\nArtwork context: {dict(row)}\n"
                f"Sales history: {[dict(s) for s in sales]}\n"
            )

    client = anthropic.AsyncAnthropic(api_key=os.environ["CLAUDE_API_KEY"])
    msg = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=SYSTEM + context,
        messages=[{"role": "user", "content": req.message}],
    )
    return {"response": msg.content[0].text}
