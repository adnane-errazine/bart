import os
import anthropic
from agents.tools import TOOL_DEFS, dispatch_tool

SYSTEM = """You are BART — an institutional-grade AI research assistant for the fine art market. \
You help collectors and investors analyze artworks, artists, auction records, and market trends \
with rigorous, data-driven analysis.

Always search for relevant data before answering. When data is sparse or unavailable, say so \
clearly and reason from what exists.

ENTITY TOKENS — critical formatting rule:
Whenever you mention a specific artwork or artist, embed an entity token inline:
  Artwork → [[artwork:ARTWORK_ID:Artwork Title]]
  Artist  → [[artist:ARTIST_ID:Artist Name]]

Example: "[[artist:ART001:Banksy]] created [[artwork:BK001:Love is in the Air]], \
which last sold for €260,000 at Sotheby's London in 2023."

Only use IDs confirmed via tool results. These tokens render as clickable navigation links \
in the interface — accuracy matters."""


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


async def run(message: str, history: list[dict], conn) -> str:
    """
    Run one turn of the global research chat.

    Args:
        message: The user's new message.
        history: Previous turns as [{role, content}] — plain text only (no tool blocks).
        conn: asyncpg connection for tool DB queries.

    Returns:
        The assistant's final text response.
    """
    client = anthropic.AsyncAnthropic(api_key=os.environ["CLAUDE_API_KEY"])

    messages: list[dict] = list(history) + [{"role": "user", "content": message}]

    while True:
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM,
            tools=TOOL_DEFS,
            messages=messages,
        )

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = await dispatch_tool(block.name, block.input, conn)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": _blocks_to_dicts(response.content)})
            messages.append({"role": "user", "content": tool_results})

        else:
            return next((b.text for b in response.content if b.type == "text"), "")
