"""
Global research chat agent — Claude Sonnet 4.6 with tool use over the
in-memory Dataset.
"""
from __future__ import annotations

import os

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
    """Convert Anthropic SDK content blocks to plain dicts for message history."""
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


async def run(message: str, history: list[dict], dataset: Dataset) -> str:
    """
    Run one turn of the global research chat.

    Args:
        message: The user's new message.
        history: Previous turns as [{role, content}] — plain text only.
        dataset: The in-memory Dataset used by all tools.
    """
    client = anthropic.AsyncAnthropic(api_key=os.environ["CLAUDE_API_KEY"])

    messages: list[dict] = list(history) + [{"role": "user", "content": message}]

    while True:
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=SYSTEM,
            tools=TOOL_DEFS,
            messages=messages,
        )

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = dispatch_tool(block.name, block.input, dataset)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": _blocks_to_dicts(response.content)})
            messages.append({"role": "user", "content": tool_results})

        else:
            return next((b.text for b in response.content if b.type == "text"), "")
