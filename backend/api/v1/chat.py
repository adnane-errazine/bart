from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db import get_db
from agents import global_chat

router = APIRouter(tags=["chat"])


class HistoryMessage(BaseModel):
    role: str     # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, conn=Depends(get_db)):
    # Convert Pydantic models to plain dicts for the agent
    history = [{"role": m.role, "content": m.content} for m in req.history]
    response = await global_chat.run(req.message, history, conn)
    return ChatResponse(response=response)
