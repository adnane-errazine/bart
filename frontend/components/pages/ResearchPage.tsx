"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

interface ToolEvent {
  type: "tool_start" | "tool_end";
  name: string;
  input?: Record<string, unknown>;
  summary?: string;
}

interface Msg {
  role: "user" | "bart";
  text: string;
  toolEvents?: ToolEvent[];
  streaming?: boolean;
}

interface ConversationSummary {
  id: string;
  created_at: string;
  first_message: string | null;
}

interface Props {
  onNavigate: (route: string, param?: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STORAGE_KEY = "bart_conversation_id";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

const TOOL_LABELS: Record<string, string> = {
  search_artworks: "Recherche œuvres",
  search_artists: "Recherche artistes",
  get_artwork_detail: "Détail œuvre",
  get_recent_sales: "Ventes récentes",
  get_segment_summary: "Résumé segment",
  get_index: "Indice de prix",
};

// ─── Entity token renderer ────────────────────────────────────────────────

function renderTokens(
  text: string,
  onNavigate: (r: string, p?: string) => void
): React.ReactNode {
  const parts = text.split(/(\[\[(?:artwork|artist):[^\]]*\]\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[\[(artwork|artist):([^:\]]+)(?::([^\]]*))?\]\]$/);
    if (m) {
      const [, type, id, name] = m;
      const label = name?.trim() || (type === "artist" ? id.replace(/^ART_/, "") : id);
      return (
        <button key={i} className="entity-chip" onClick={() => onNavigate(type, id)}>
          {label}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── Tool trace row ───────────────────────────────────────────────────────

function ToolTrace({ events }: { events: ToolEvent[] }) {
  if (!events.length) return null;
  const pairs: Array<{ start: ToolEvent; end?: ToolEvent }> = [];
  for (const e of events) {
    if (e.type === "tool_start") pairs.push({ start: e });
    else if (e.type === "tool_end") {
      const last = pairs[pairs.length - 1];
      if (last && !last.end) last.end = e;
    }
  }
  return (
    <div className="tool-trace">
      {pairs.map((p, i) => (
        <div key={i} className={`tool-step${p.end ? " done" : " pending"}`}>
          <span className="tool-step-dot" />
          <span className="tool-step-name">{TOOL_LABELS[p.start.name] ?? p.start.name}</span>
          {p.start.input?.query != null && (
            <span className="tool-step-query">"{String(p.start.input.query)}"</span>
          )}
          {p.end?.summary && (
            <span className="tool-step-result">{p.end.summary}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Message renderer ─────────────────────────────────────────────────────

function BartMessage({
  msg,
  onNavigate,
}: {
  msg: Msg;
  onNavigate: (r: string, p?: string) => void;
}) {
  return (
    <div className="chat-msg bart">
      <div className="role">BART</div>
      {msg.toolEvents && msg.toolEvents.length > 0 && (
        <ToolTrace events={msg.toolEvents} />
      )}
      {msg.text ? (
        msg.text.split("\n").map((line, i, arr) => (
          <p key={i}>
            {renderTokens(line, onNavigate)}
            {msg.streaming && i === arr.length - 1 && (
              <span className="streaming-cursor" />
            )}
          </p>
        ))
      ) : msg.streaming ? (
        <div className="thinking-dots">
          <span /><span /><span />
        </div>
      ) : null}
    </div>
  );
}

// ─── Conversation sidebar ─────────────────────────────────────────────────

function ConvSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="conv-sidebar">
      <div className="conv-sidebar-head">
        <span>Conversations</span>
        <button className="tool-btn" onClick={onNew}>Nouveau</button>
      </div>
      {conversations.map((c) => (
        <div
          key={c.id}
          className={`conv-item${c.id === activeId ? " active" : ""}`}
          onClick={() => onSelect(c.id)}
        >
          <div className="conv-item-text">
            {c.first_message?.slice(0, 48) ?? "Nouvelle conversation"}
          </div>
          <div className="conv-item-date">
            {c.created_at.slice(0, 10)}
          </div>
        </div>
      ))}
      {conversations.length === 0 && (
        <div className="caption" style={{ padding: "12px 14px" }}>Aucune conversation</div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

const GREETING: Msg = {
  role: "bart",
  text: "BART Research Agent en ligne. Posez vos questions sur le marché de l'art — valorisations, historique de ventes, trajectoires d'artistes ou analyse de segment. Je consulte la base de données avant chaque réponse.",
};

export function ResearchPage({ onNavigate }: Props) {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamingIndexRef = useRef<number>(-1);
  // Buffer for smooth streaming — flushes to state via rAF instead of every token
  const streamBufRef = useRef<string>("");
  const rafRef = useRef<number>(0);

  // Scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/conversations`, { headers: NGROK_HEADERS });
      if (res.ok) setConversations(await res.json());
    } catch { /* offline */ }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setConversationId(saved);
    loadConversations();
  }, [loadConversations]);

  // Load a past conversation
  async function loadConversation(id: string) {
    try {
      const res = await fetch(`${API_URL}/api/v1/chat/conversations/${id}`, { headers: NGROK_HEADERS });
      if (!res.ok) return;
      const data = await res.json();
      const loaded: Msg[] = [GREETING];
      for (const m of data.messages) {
        loaded.push({
          role: m.role === "user" ? "user" : "bart",
          text: m.content,
          toolEvents: m.tool_events ?? [],
        });
      }
      setMessages(loaded);
      setConversationId(id);
      localStorage.setItem(STORAGE_KEY, id);
      setShowSidebar(false);
    } catch { /* offline */ }
  }

  function startNew() {
    setMessages([GREETING]);
    setConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
    setShowSidebar(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    // Add user message + empty streaming BART message
    const bartIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "bart", text: "", toolEvents: [], streaming: true },
    ]);
    streamingIndexRef.current = bartIndex;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Accumulators — text flushed via rAF for smooth rendering
      const currentTools: ToolEvent[] = [];
      streamBufRef.current = "";
      cancelAnimationFrame(rafRef.current);

      const updateMsg = (patch: Partial<Msg>) => {
        setMessages((prev) => {
          const next = [...prev];
          const idx = streamingIndexRef.current;
          if (idx >= 0 && idx < next.length) {
            next[idx] = { ...next[idx], ...patch };
          }
          return next;
        });
      };

      // rAF loop: flushes buffered text to state ~60fps instead of per-token
      const scheduleFlush = () => {
        rafRef.current = requestAnimationFrame(() => {
          const buf = streamBufRef.current;
          if (buf !== undefined) updateMsg({ text: buf });
          // keep scheduling while streaming
          if (loading) scheduleFlush();
        });
      };
      scheduleFlush();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(part.slice(6));
          } catch {
            continue;
          }

          if (event.type === "conversation_id") {
            const id = event.id as string;
            setConversationId(id);
            localStorage.setItem(STORAGE_KEY, id);

          } else if (event.type === "tool_start" || event.type === "tool_end") {
            currentTools.push(event as unknown as ToolEvent);
            updateMsg({ toolEvents: [...currentTools] });

          } else if (event.type === "text_delta") {
            // Write to buffer only — rAF loop drains it smoothly
            streamBufRef.current += event.text as string;

          } else if (event.type === "done") {
            // Final flush then mark done
            cancelAnimationFrame(rafRef.current);
            updateMsg({ text: streamBufRef.current, streaming: false });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const idx = streamingIndexRef.current;
        if (idx >= 0 && idx < next.length) {
          next[idx] = {
            role: "bart",
            text: "Erreur de connexion — le backend est-il en cours d'exécution ?",
          };
        }
        return next;
      });
    } finally {
      setLoading(false);
      loadConversations();
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">AI-Powered</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Research Agent</h1>
          <div className="caption mt-4">
            RAG · SQLite history · entités cliquables
          </div>
        </div>
        <div className="page-header-right">
          <button className="tool-btn" onClick={() => { setShowSidebar((v) => !v); loadConversations(); }}>
            Historique
          </button>
          <button className="tool-btn" onClick={startNew}>Nouveau</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {showSidebar && (
          <ConvSidebar
            conversations={conversations}
            activeId={conversationId}
            onSelect={loadConversation}
            onNew={startNew}
          />
        )}

        <div className="research-chat" style={{ flex: 1 }}>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {messages.map((m, i) =>
              m.role === "bart" ? (
                <BartMessage key={i} msg={m} onNavigate={onNavigate} />
              ) : (
                <div key={i} className="chat-msg user">
                  <div className="role">Vous</div>
                  <p>{m.text}</p>
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              placeholder="Posez vos questions sur le marché de l'art…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button
              className="tool-btn active"
              onClick={send}
              disabled={loading || !input.trim()}
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
