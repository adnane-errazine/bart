# Stack Choices — Simplified Cloud-First

**Date:** 2026-04-25
**Status:** accepted

## Decisions

**LLM + Search:** Gemini 2.0 Flash with Google Search grounding
**Agents:** PydanticAI (provider-agnostic, type-safe)
**DB + Vectors:** Supabase PostgreSQL + pgvector
**Embeddings:** Google text-embedding-004 (same API key as LLM)
**Scheduler:** APScheduler in-process, every 5 min
**Deploy:** Vercel (frontend) + Railway (backend)

## Why Gemini over Claude/OpenAI
Google Search grounding is native — eliminates Serper API as a dependency. Free tier covers hackathon volume.

## Why PydanticAI over raw tool use
Provider-agnostic. If Gemini rate-limits us mid-hackathon we can swap to GPT-4o without touching agent logic.

## Why Supabase pgvector over Chroma/Weaviate/Pinecone
Zero additional service. pgvector runs inside our existing Supabase instance — one URL, one key, one free tier to worry about.

## Why 5-min proactive agent interval
It's a hackathon. We want to show live signals during the demo, not wait 30 minutes.

## Consequences
- One Google API key covers LLM + embeddings + search
- One Supabase project covers DB + vector store + real-time if needed
- Backend on Railway is a thin HTTP + agent orchestration layer only
