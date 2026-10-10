import { useState } from "react";
import { Copy, Check, Download, RefreshCw, ExternalLink } from "lucide-react";
import type { Message, Source } from "@/types";
import { formatMarkdown, exportAsText } from "@/lib/markdown";
import { safeExternalUrl } from "@/lib/urls";

interface AnswerCardProps {
  message: Message;
  onRetry?: () => void;
}

export function AnswerCard({ message, onRetry }: AnswerCardProps) {
  const [copied, setCopied] = useState(false);
  const sources = message.sources || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const text = exportAsText("Seekora AI Response", message.content, sources);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seekora-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-bold text-slate-300">You</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-cyan-500/20">
          <span className="text-xs font-bold text-white">AI</span>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
          />

          {sources.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sources</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((src, i) => {
                  const url = safeExternalUrl(src.url);
                  const title = src.title || src.url;
                  return url ? (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:text-cyan-300 transition-all max-w-xs"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{title}</span>
                    </a>
                  ) : (
                    <span key={i} className="text-xs text-slate-400">{title}</span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SourceLink({ source }: { source: Source }) {
  const url = safeExternalUrl(source.url);
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:text-cyan-300 transition-all"
    >
      <ExternalLink className="w-3 h-3" />
      {source.title || source.url}
    </a>
  ) : (
    <span className="text-xs text-slate-400">{source.title || source.url}</span>
  );
}
