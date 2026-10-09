import { useEffect, useRef, useState } from "react";
import { sendToAI } from "@/lib/api";
import type { ChatMessage } from "@/types";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", content: "Hi! I'm Seekora. Ask me about a topic, request an explanation, or ask about current information." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");

    const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await sendToAI({ query: q, mode: "chat", history, save: false });
      setMessages((prev) => [...prev, { role: "bot", content: res.answer, sources: res.sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)} title="Open Seekora guide" aria-label="Open Seekora guide">
        💬
      </button>
      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            Seekora Demo Guide
            <span className="status">AI powered</span>
          </div>
          <div className="chat-body" ref={bodyRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role === "user" ? "user" : "bot"}`}>
                {msg.content}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="chat-sources">
                    <strong>Sources</strong>
                    {msg.sources.map((s, j) => (
                      <a key={j} href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.title || s.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="msg bot typing">
                <i></i>
                <i></i>
                <i></i>
              </div>
            )}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="chat-send" onClick={handleSend}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
