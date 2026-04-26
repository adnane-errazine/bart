"""
SQLite store for conversation history.
Artwork / sales data stays in the in-memory Dataset (loaded from CSV).
"""
from __future__ import annotations

import json
import uuid
from pathlib import Path

import aiosqlite

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "bart.db"


def _conversation_title(content: str) -> str:
    title = " ".join(content.strip().split())
    return title[:57] + "..." if len(title) > 60 else title


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversation (
                id          TEXT PRIMARY KEY,
                title       TEXT,
                created_at  TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS message (
                id                  TEXT PRIMARY KEY,
                conversation_id     TEXT NOT NULL REFERENCES conversation(id),
                role                TEXT NOT NULL,
                content             TEXT NOT NULL,
                tool_events         TEXT,
                created_at          TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_msg_conv ON message(conversation_id)"
        )
        await db.commit()


async def get_or_create_conversation(conversation_id: str | None) -> str:
    async with aiosqlite.connect(DB_PATH) as db:
        if conversation_id:
            async with db.execute(
                "SELECT id FROM conversation WHERE id = ?", (conversation_id,)
            ) as cur:
                if await cur.fetchone():
                    return conversation_id
        new_id = str(uuid.uuid4())
        await db.execute("INSERT INTO conversation (id) VALUES (?)", (new_id,))
        await db.commit()
        return new_id


async def get_history(conversation_id: str) -> list[dict]:
    """Returns [{role, content}] plain-text turns for the agent."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT role, content FROM message "
            "WHERE conversation_id = ? ORDER BY created_at",
            (conversation_id,),
        ) as cur:
            rows = await cur.fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in rows]


async def save_message(
    conversation_id: str,
    role: str,
    content: str,
    tool_events: list[dict] | None = None,
) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        if role == "user":
            await db.execute(
                """
                UPDATE conversation
                SET title = COALESCE(title, ?)
                WHERE id = ?
                """,
                (_conversation_title(content), conversation_id),
            )
        await db.execute(
            """
            INSERT INTO message (id, conversation_id, role, content, tool_events)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                conversation_id,
                role,
                content,
                json.dumps(tool_events, ensure_ascii=False) if tool_events else None,
            ),
        )
        await db.commit()


async def list_conversations() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """
            SELECT c.id, c.created_at, c.title,
                   (SELECT content FROM message
                    WHERE conversation_id = c.id AND role = 'user'
                    ORDER BY created_at LIMIT 1) AS first_message
            FROM conversation c
            ORDER BY c.created_at DESC
            LIMIT 50
            """
        ) as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def get_conversation_messages(conversation_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM message WHERE conversation_id = ? ORDER BY created_at",
            (conversation_id,),
        ) as cur:
            rows = await cur.fetchall()
    return [
        {
            **dict(r),
            "tool_events": json.loads(r["tool_events"]) if r["tool_events"] else [],
        }
        for r in rows
    ]
