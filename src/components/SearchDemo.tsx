import { useRef, useState } from "react";
import { sendToAI } from "@/lib/api";
import { showToast } from "@/components/Toast";
import type { Source } from "@/types";

interface SearchResult {
  answer: string;
  sources: Source[];
}

export function SearchDemo({ onRequireAuth }: { onRequireAuth: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlResult, setUrlResult] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) {
      showToast("Enter a question to search.");
      return;
    }
    if (!searchQuery) setQuery(q);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await sendToAI({ query: q, mode: "ask", save: false });
      setResult({ answer: res.answer, sources: res.sources });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (q: string) => {
    setQuery(q);
    handleSearch(q);
    document.getElementById("searchResult")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleVoice = () => {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast("Voice search not supported in this browser — try Chrome!");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    showToast("Listening... speak now!");
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      handleSearch(text);
    };
    rec.onerror = () => showToast("Couldn't hear you — try again!");
    rec.start();
  };

  const handleUrlAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const urlInput = form.elements.namedItem("analysisUrl") as HTMLInputElement;
    const url = urlInput.value.trim();
    if (!url) return;

    setUrlLoading(true);
    setUrlResult(null);

    try {
      const res = await sendToAI({ query: url, mode: "analyze_url", save: false });
      setUrlResult(res.answer);
    } catch (err) {
      setUrlResult(err instanceof Error ? err.message : "Could not summarize that webpage.");
    } finally {
      setUrlLoading(false);
    }
  };

  const handleImageAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("analysisImage") as HTMLInputElement;
    const promptInput = form.elements.namedItem("imagePrompt") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setImageLoading(true);
    setImageResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result as string;
        try {
          const res = await sendToAI({
            query: promptInput.value.trim() || "Please describe and analyze this image in detail.",
            mode: "analyze_image",
            imageData,
            save: false,
          });
          setImageResult(res.answer);
        } catch (err) {
          setImageResult(err instanceof Error ? err.message : "Could not analyze that image.");
        } finally {
          setImageLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setImageResult("Could not read the image file.");
      setImageLoading(false);
    }
  };

  const copyAnswer = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast("Answer copied"));
  };

  const downloadAnswer = (text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seekora-answer.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMarkdownText = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h4 key={i} style={{ color: "var(--text)", fontSize: "1rem", fontWeight: 700, marginTop: "12px" }}>{line.slice(3)}</h4>;
      if (line.startsWith("- ")) return <li key={i} style={{ color: "var(--muted)", fontSize: "0.93rem", marginLeft: "20px" }}>{line.slice(2)}</li>;
      if (line.trim()) return <p key={i} style={{ color: "var(--muted)", fontSize: "0.93rem", marginTop: "8px" }}>{line}</p>;
      return <br key={i} />;
    });
  };

  return (
    <section id="demo" className="sk-section" style={{ textAlign: "center" }}>
      <span className="tag reveal visible">AI Search</span>
      <h2 className="section-title reveal visible">
        Ask <span className="grad-text">anything</span>
      </h2>
      <p className="section-sub reveal visible" style={{ marginLeft: "auto", marginRight: "auto" }}>
        Ask general questions, request explanations, or ask about current information. Seekora uses AI to answer the full question with sources.
      </p>

      <div className="search-box reveal visible">
        <input
          type="search"
          maxLength={500}
          aria-label="Ask Seekora a question"
          placeholder="Ask anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button className="btn btn-ghost mic-btn" onClick={handleVoice} title="Voice search" disabled={loading}>
          🎙️
        </button>
        <button className="btn" onClick={() => handleSearch()} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="suggestions reveal visible">
        {[
          { label: "Quantum computing", q: "What is quantum computing?" },
          { label: "Photosynthesis", q: "Explain photosynthesis" },
          { label: "How AI works", q: "How does AI work?" },
          { label: "Climate change", q: "What is climate change?" },
        ].map((s) => (
          <button key={s.label} className="sug" onClick={() => handleSuggestion(s.q)} disabled={loading}>
            {s.label}
          </button>
        ))}
      </div>

      {(result || error || loading) && (
        <div className="search-result" id="searchResult">
          <h3 style={{ fontSize: "1rem" }}>Seekora Result</h3>
          {loading && <p style={{ color: "var(--muted)", fontSize: "0.93rem", marginTop: "10px" }}>Searching the knowledge base...</p>}
          {error && <p style={{ color: "var(--pink)", fontSize: "0.93rem", marginTop: "10px" }}>{error}</p>}
          {result && (
            <>
              <div style={{ marginTop: "10px" }}>{renderMarkdownText(result.answer)}</div>
              {result.sources.length > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--cyan)", display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "14px" }}>
                  {result.sources.map((src, i) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer">
                      {src.title || "Source"}
                    </a>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button className="btn btn-ghost" onClick={() => copyAnswer(result.answer)}>Copy answer</button>
                <button className="btn btn-ghost" onClick={() => downloadAnswer(result.answer)}>Download .txt</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="search-note">
        <strong>Analyze a webpage or image</strong>
        <form onSubmit={handleUrlAnalysis} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          <input
            name="analysisUrl"
            type="url"
            required
            maxLength={2048}
            placeholder="https://example.com/article"
            style={{ flex: 1, minWidth: "220px", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)" }}
          />
          <button className="btn btn-ghost" type="submit" disabled={urlLoading}>
            {urlLoading ? "Fetching..." : "Summarize URL"}
          </button>
        </form>
        <form onSubmit={handleImageAnalysis} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          <input
            name="analysisImage"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            required
            style={{ flex: 1, minWidth: "200px", color: "var(--muted)" }}
          />
          <input
            name="imagePrompt"
            type="text"
            maxLength={500}
            placeholder="What should I look for? (optional)"
            style={{ flex: 1, minWidth: "200px", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)" }}
          />
          <button className="btn btn-ghost" type="submit" disabled={imageLoading}>
            {imageLoading ? "Analyzing..." : "Analyze image"}
          </button>
        </form>
        {(urlResult || urlLoading) && (
          <div style={{ marginTop: "16px", color: "var(--text)", whiteSpace: "pre-wrap", textAlign: "left" }}>
            {urlLoading ? "Reading the public webpage..." : renderMarkdownText(urlResult || "")}
          </div>
        }
        {(imageResult || imageLoading) && (
          <div style={{ marginTop: "16px", color: "var(--text)", whiteSpace: "pre-wrap", textAlign: "left" }}>
            {imageLoading ? "Uploading and analyzing the image..." : renderMarkdownText(imageResult || "")}
          </div>
        )}
      </div>

      <p className="search-note">
        <strong>Answers with sources:</strong> AI can answer beyond saved topics and search the web for current information. Questions sent for AI answers are processed by our AI provider.
      </p>
    </section>
  );
}
