import { useRef, useState, type FormEvent } from "react";
import { Send, ImagePlus, Loader2, X, Link as LinkIcon, Search as SearchIcon, MessageSquare } from "lucide-react";
import type { SearchMode } from "@/types";

interface SearchInputProps {
  onSubmit: (query: string, mode: SearchMode, imageData?: string) => void;
  loading: boolean;
  disabled?: boolean;
}

const MODE_CONFIG: Record<SearchMode, { label: string; icon: typeof MessageSquare; placeholder: string }> = {
  ask: {
    label: "Ask AI",
    icon: MessageSquare,
    placeholder: "Ask any question and get a structured answer...",
  },
  research: {
    label: "Research",
    icon: SearchIcon,
    placeholder: "Enter a research question — Seekora will find sources...",
  },
  analyze_url: {
    label: "Analyze URL",
    icon: LinkIcon,
    placeholder: "Paste a webpage URL to get a structured summary...",
  },
  analyze_image: {
    label: "Analyze Image",
    icon: ImagePlus,
    placeholder: "Upload an image and ask a question about it...",
  },
};

export function SearchInput({ onSubmit, loading, disabled }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("ask");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading || disabled) return;
    onSubmit(query.trim(), mode, imageData || undefined);
    setQuery("");
    setImageData(null);
    setImageName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
    setMode("analyze_image");
  };

  const modes = Object.entries(MODE_CONFIG) as [SearchMode, typeof MODE_CONFIG[SearchMode]][];
  const currentConfig = MODE_CONFIG[mode];

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 py-4">
        {imageData && (
          <div className="mb-3 inline-flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <img src={imageData} alt="upload preview" className="w-8 h-8 rounded object-cover" />
            <span className="text-xs text-slate-300 max-w-32 truncate">{imageName}</span>
            <button
              onClick={() => { setImageData(null); setImageName(""); }}
              className="text-slate-500 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-1.5 mb-3 flex-wrap">
          {modes.map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === key
                    ? "bg-cyan-600/20 text-cyan-300 border border-cyan-600/40"
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-slate-800/60 border border-slate-700 rounded-2xl p-2 focus-within:border-cyan-600/50 transition-colors">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2.5 text-slate-400 hover:text-cyan-400 transition-colors rounded-xl hover:bg-slate-700/50"
              title="Upload image for analysis"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={1}
              placeholder={currentConfig.placeholder}
              className="flex-1 bg-transparent text-white placeholder-slate-500 resize-none outline-none py-2.5 max-h-32 overflow-y-auto"
              style={{ minHeight: "44px" }}
            />

            <button
              type="submit"
              disabled={!query.trim() || loading || disabled}
              className="p-2.5 bg-gradient-to-br from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-600 mt-2 text-center">
          Seekora AI can make mistakes. Verify important information from sources.
        </p>
      </div>
    </div>
  );
}
