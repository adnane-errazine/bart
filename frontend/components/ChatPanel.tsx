"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL: Message[] = [
  {
    role: "assistant",
    content:
      "BART online. I can help you analyze artworks, compare valuations, and interpret market trends. What would you like to know?",
  },
];

export function ChatPanel({ artworkId }: { artworkId?: string }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { response } = await api.chat(text, artworkId);
      setMessages((m) => [...m, { role: "assistant", content: response }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Error reaching BART. Check API connection." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col border-t"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: "var(--accent)" }}>
          RESEARCH AGENT
        </span>
        {loading && (
          <span className="flex gap-1 items-center ml-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full animate-bounce"
                style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-52 min-h-36">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <span className="text-[10px] font-mono mt-0.5 shrink-0" style={{ color: "var(--accent)" }}>
                BART
              </span>
            )}
            <p
              className="text-xs leading-relaxed max-w-2xl"
              style={{ color: m.role === "user" ? "var(--muted)" : "var(--text)" }}
            >
              {m.content}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex border-t" style={{ borderColor: "var(--border)" }}>
        <input
          className="flex-1 bg-transparent px-4 py-2 text-xs font-mono outline-none placeholder:text-[var(--muted)]"
          placeholder="Ask anything about the art market..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 text-[10px] font-mono font-bold tracking-widest border-l transition-colors disabled:opacity-30"
          style={{
            borderColor: "var(--border)",
            color: "var(--accent)",
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
