"use client";

import { useState, useRef, useEffect } from "react";

interface Msg {
  role: "user" | "bart";
  text: string;
}

interface Props {
  onNavigate: (route: string, param?: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Parse [[artwork:ID:Name]] and [[artist:ID:Name]] tokens into JSX.
function renderTokens(text: string, onNavigate: (r: string, p?: string) => void) {
  const parts = text.split(/(\[\[(?:artwork|artist):[^\]]+\]\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[\[(artwork|artist):([^:]+):(.+)\]\]$/);
    if (m) {
      const [, type, id, name] = m;
      return (
        <button key={i} className="entity-chip" onClick={() => onNavigate(type, id)}>
          {name}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function BartMessage({ text, onNavigate }: { text: string; onNavigate: (r: string, p?: string) => void }) {
  return (
    <div className="chat-msg bart">
      <div className="role">BART</div>
      {text.split("\n").map((line, i) => (
        <p key={i}>{renderTokens(line, onNavigate)}</p>
      ))}
    </div>
  );
}

const GREETING = "BART Research Agent online. Ask me anything about the art market — valuations, auction history, artist trajectories, or segment analysis. I search our database before every response.";

export function ResearchPage({ onNavigate }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bart", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Msg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Build history from current messages (exclude the greeting)
    const history = messages
      .slice(1) // skip the greeting
      .map((m) => ({ role: m.role === "bart" ? "assistant" : "user", content: m.text }));

    try {
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bart", text: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bart", text: "Connection error — is the backend running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">AI-Powered</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Research Agent</h1>
          <div className="caption mt-4">RAG over artworks, artists, and auction records · click entities to navigate</div>
        </div>
      </div>

      <div className="research-chat">
        <div style={{ flex: 1, overflowY: "auto" }}>
          {messages.map((m, i) =>
            m.role === "bart" ? (
              <BartMessage key={i} text={m.text} onNavigate={onNavigate} />
            ) : (
              <div key={i} className="chat-msg user">
                <div className="role">You</div>
                <p>{m.text}</p>
              </div>
            )
          )}

          {loading && (
            <div className="chat-msg bart">
              <div className="role">BART</div>
              <div className="thinking-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Ask anything about the art market…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
          />
          <button className="tool-btn" onClick={send} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
