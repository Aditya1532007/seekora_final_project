import { useEffect, useRef, useState } from "react";

export function Hero({ onAskSeekora }: { onAskSeekora: () => void }) {
  const termRef = useRef<HTMLDivElement>(null);
  const [termLines, setTermLines] = useState<{ cls: string; text: string }[]>([]);

  useEffect(() => {
    const lines = [
      { cls: "p1", text: '$ search "quantum computing"' },
      { cls: "p3", text: "> Checking local knowledge base..." },
      { cls: "p2", text: "> Matching stored topic..." },
      { cls: "p3", text: "> Loading saved source links..." },
      { cls: "p2", text: "> Demo result ready" },
      { cls: "p4", text: "> Summary retrieved from the selected knowledge base entry." },
      { cls: "p1", text: "$ _" },
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) {
        setTermLines((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 650);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const onMouseMove = (e: MouseEvent) => {
      const r = term.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      if (Math.abs(dx) < 1.2 && Math.abs(dy) < 1.2) {
        term.style.transform = `rotateY(${dx * 7}deg) rotateX(${-dy * 7}deg)`;
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <section id="hero" className="hero">
      <div>
        <span className="tag reveal visible">AI answers with sources</span>
        <h1 className="reveal visible d1">
          Explore <span className="grad-text">anything</span> with clear sources.
        </h1>
        <p className="lead reveal visible d2">
          Ask general questions, get a fuller AI answer, and use web search for current information.
          Seekora can use saved topic summaries as background and include clickable sources.
        </p>
        <div className="hero-btns reveal visible d3">
          <button className="btn" onClick={onAskSeekora}>
            Ask Seekora
          </button>
          <a href="#how">
            <button className="btn btn-ghost">See how it works</button>
          </a>
        </div>
      </div>
      <div className="hero-visual reveal visible d2">
        <div className="float-badge fb1" style={{ top: "-24px", right: "-14px", color: "var(--cyan)" }}>
          Local topic collection
        </div>
        <div className="terminal" ref={termRef} id="terminal">
          <div className="term-head">
            <div className="dot" style={{ background: "#ff5f57" }} />
            <div className="dot" style={{ background: "#febc2e" }} />
            <div className="dot" style={{ background: "#28c840" }} />
            <span className="term-title">seekora — sample search</span>
          </div>
          <div className="term-body" id="termBody">
            {termLines.map((line, i) => (
              <div key={i} className={line.cls}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
        <div
          className="float-badge fb2"
          style={{ bottom: "-22px", left: "-20px", color: "var(--green)", animationDelay: "1.4s" }}
        >
          Curated Topic Sources
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const items = [
    "Knowledge Base Search",
    "Stored Topic Summaries",
    "Topic Source Links",
    "Search History",
    "Voice Input",
    "Account Profiles",
    "Newsletter Signup",
    "Contact Form",
    "Seekora Chat",
  ];
  const html = items.map((t) => `<span>${t}</span>`).join("");

  return (
    <div className="marquee">
      <div className="marquee-track" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="marquee-track" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
