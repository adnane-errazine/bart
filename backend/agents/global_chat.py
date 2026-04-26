"""
Global research chat agent — Claude Sonnet 4.6 with tool use over the
in-memory Dataset (+ Qdrant semantic search when available).

Exposes `stream()` — an async generator that yields SSE-ready dicts:
  {"type": "tool_start",  "name": str, "input": dict}
  {"type": "tool_end",    "name": str, "summary": str}
  {"type": "text_delta",  "text": str}
  {"type": "done"}
"""
from __future__ import annotations

import json
import os
from typing import AsyncGenerator

import anthropic

from agents.tools import TOOL_DEFS, dispatch_tool
from services.dataset import Dataset

SYSTEM = """You are BART — an institutional research assistant for the fine art market. Reply in \
the same language as the user's message (default French if ambiguous).

VOICE
Write like a Bloomberg analyst note, not a chatbot. Direct, factual, neutral. Drop into the \
substance immediately — no openers like "Voici une analyse", "Bien sûr", "Let me explain". \
No conclusions like "En conclusion" or "En résumé". The reader is a professional, not a tourist.

FORMATTING — strict
Plain text only. The UI does NOT render markdown.
- NO headings (no `#`, no `##`).
- NO bold/italic (no `**`, no `*`, no `_`).
- NO tables (no `|`).
- NO bullet lists, numbered lists, or `-` / `•` prefixes.
- NO horizontal rules (`---`).
- NO emojis.
- NO code fences.
Use short paragraphs separated by blank lines. Numbers belong inside sentences, not in tables. \
Three to six paragraphs is plenty for most answers.

ENTITY TOKENS — required when naming an artwork or artist
Embed inline so the UI renders a clickable chip:
  Artwork: [[artwork:ARTWORK_ID:Title]]
  Artist:  [[artist:ARTIST_ID:Name]]
Example sentence: "[[artist:ART_BNK:Banksy]] a vu [[artwork:BNK001:Girl with Balloon]] \
adjugée 21,85 M€ chez Sotheby's en 2021."
Only use IDs returned by tools. If you don't have the ID, write the name plain.

DATA DISCIPLINE
Use the tools before answering anything specific. When a tool returns a \
`price_change_explanation`, treat it as the source of truth for why the market moved — \
weave its content naturally into your sentences rather than restating it verbatim. \
If the data is thin, say so in one sentence and reason from what exists."""


def _blocks_to_dicts(content: list) -> list[dict]:
    result = []
    for block in content:
        if block.type == "text":
            result.append({"type": "text", "text": block.text})
        elif block.type == "tool_use":
            result.append({
                "type": "tool_use",
                "id": block.id,
                "name": block.name,
                "input": block.input,
            })
    return result


def _tool_summary(name: str, result_json: str) -> str:
    """Human-readable summary of a tool result for the traceability UI."""
    try:
        data = json.loads(result_json)
        if isinstance(data, list):
            return f"{len(data)} résultat{'s' if len(data) != 1 else ''}"
        if isinstance(data, dict):
            if "error" in data:
                return f"erreur : {data['error']}"
            if "artwork" in data:
                title = data["artwork"].get("title", "")
                n_sales = len(data.get("sales", []))
                return f"{title} · {n_sales} vente{'s' if n_sales != 1 else ''}"
            if "category" in data and "sale_count" in data:
                return f"{data['sale_count']} ventes · moy. {data.get('avg_price_eur', 0):,.0f} €"
    except Exception:
        pass
    return "ok"


async def stream(
    message: str,
    history: list[dict],
    ds: Dataset,
) -> AsyncGenerator[dict, None]:
    """
    Async generator for one chat turn.
    Yields SSE event dicts; the route serialises them to text/event-stream.
    """
    client = anthropic.AsyncAnthropic(api_key=os.environ["CLAUDE_API_KEY"])
    messages: list[dict] = list(history) + [{"role": "user", "content": message}]

    while True:
        # ── Stream one Claude response ────────────────────────────────────
        async with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=SYSTEM,
            tools=TOOL_DEFS,
            messages=messages,
        ) as s:
            async for text in s.text_stream:
                yield {"type": "text_delta", "text": text}
            final = await s.get_final_message()

        if final.stop_reason != "tool_use":
            break

        # ── Execute tool calls and yield trace events ─────────────────────
        tool_use_blocks = [b for b in final.content if b.type == "tool_use"]
        tool_results = []

        for block in tool_use_blocks:
            yield {"type": "tool_start", "name": block.name, "input": block.input}

            result_json = await dispatch_tool(block.name, block.input, ds)

            yield {
                "type": "tool_end",
                "name": block.name,
                "summary": _tool_summary(block.name, result_json),
            }

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result_json,
            })

        messages.append({"role": "assistant", "content": _blocks_to_dicts(final.content)})
        messages.append({"role": "user", "content": tool_results})

    yield {"type": "done"}
