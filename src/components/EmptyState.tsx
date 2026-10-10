import { Sparkles, MessageSquare, Link as LinkIcon, Search as SearchIcon, ImagePlus, ArrowRight } from "lucide-react";
import type { SearchMode } from "@/types";

interface EmptyStateProps {
  onSuggestion: (query: string, mode: SearchMode) => void;
}

const SUGGESTIONS: { icon: typeof Sparkles; label: string; query: string; mode: SearchMode; category: string }[] = [
  { icon: MessageSquare, label: "Explain a concept", query: "Explain how quantum computing works in simple terms", mode: "ask", category: "Ask" },
  { icon: SearchIcon, label: "Research a topic", query: "What are the latest breakthroughs in renewable energy?", mode: "research", category: "Research" },
  { icon: LinkIcon, label: "Summarize a webpage", query: "https://en.wikipedia.org/wiki/Artificial_intelligence", mode: "analyze_url", category: "Analyze URL" },
  { icon: ImagePlus, label: "Analyze an image", query: "Describe what you see in this image", mode: "analyze_image", category: "Analyze Image" },
];

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-y-auto">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20 mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white tracking-tight">Welcome to Seekora AI</h2>
      <p className="text-slate-400 mt-3 text-center max-w-md">
        Ask questions and research topics with answers summarized from multiple websites and linked sources. You can also analyze webpages and images.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              onClick={() => onSuggestion(s.query, s.mode)}
              className="group flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-4 text-left transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-700 group-hover:bg-cyan-600/20 flex items-center justify-center transition-colors">
                <Icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider">{s.category}</p>
                <p className="text-sm text-slate-200 mt-0.5 truncate">{s.label}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
