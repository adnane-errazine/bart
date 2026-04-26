"""
Chat routes — SSE streaming + conversation history via SQLite.
"""
from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents import global_chat
from services import dataset, db

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


# ─── SSE chat endpoint ────────────────────────────────────────────────────


@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    ds = dataset.get()

    async def generate():
        # Ensure conversation exists in SQLite
        conv_id = await db.get_or_create_conversation(req.conversation_id)
        yield f"data: {json.dumps({'type': 'conversation_id', 'id': conv_id}, ensure_ascii=False)}\n\n"

        # Load full history from SQLite
        history = await db.get_history(conv_id)

        full_response = ""
        tool_events: list[dict] = []

        async for event in global_chat.stream(req.message, history, ds):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

            if event["type"] == "text_delta":
                full_response += event["text"]
            elif event["type"] in ("tool_start", "tool_end"):
                tool_events.append(event)

        # Persist both turns
        await db.save_message(conv_id, "user", req.message)
        await db.save_message(conv_id, "assistant", full_response, tool_events or None)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Conversation history routes ─────────────────────────────────────────


@router.get("/chat/conversations")
async def list_conversations():
    return await db.list_conversations()


@router.get("/chat/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    messages = await db.get_conversation_messages(conversation_id)
    return {"conversation_id": conversation_id, "messages": messages}
