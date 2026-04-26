from fastapi import APIRouter
from pydantic import BaseModel

from agents import global_chat
from services import dataset

router = APIRouter(tags=["chat"])


class HistoryMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    ds = dataset.get()
    history = [{"role": m.role, "content": m.content} for m in req.history]
    response = await global_chat.run(req.message, history, ds)
    return ChatResponse(response=response)
