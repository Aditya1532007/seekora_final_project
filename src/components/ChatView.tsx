import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, AlertCircle, Menu, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getConversationMessages, sendToAI } from "@/lib/api";
import type { Conversation, Message, SearchMode } from "@/types";
import { Sidebar } from "@/components/Sidebar";
import { SearchInput } from "@/components/SearchInput";
import { AnswerCard } from "@/components/AnswerCard";
import { EmptyState } from "@/components/EmptyState";

export function ChatView() {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationViewRef = useRef(0);
  const messageLoadRef = useRef(0);
  const [retryRequest, setRetryRequest] = useState<{
    query: string;
    mode: SearchMode;
    imageData?: string;
  } | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const loadMessages = useCallback(async (convId: string) => {
    const requestId = ++messageLoadRef.current;
    setLoadingMessages(true);
    try {
      const loaded = await getConversationMessages(convId);
      if (requestId === messageLoadRef.current) {
        setMessages(loaded);
        setError(null);
      }
    } catch (loadError) {
      if (requestId === messageLoadRef.current) {
        setError(loadError instanceof Error ? loadError.message : "Could not load conversation.");
      }
    } finally {
      if (requestId === messageLoadRef.current) setLoadingMessages(false);
    }
  }, []);

  const handleSelectConversation = (id: string) => {
    conversationViewRef.current += 1;
    setActiveId(id);
    setError(null);
    setRetryRequest(null);
    setSidebarOpen(false);
    loadMessages(id);
  };

  const handleNewConversation = () => {
    conversationViewRef.current += 1;
    messageLoadRef.current += 1;
    setActiveId(null);
    setMessages([]);
    setError(null);
    setRetryRequest(null);
    setLoadingMessages(false);
    setSidebarOpen(false);
  };

  const handleDeleted = (id: string) => {
    if (activeId === id) {
      handleNewConversation();
    }
  };

  const handleSuggestion = (query: string, _mode: SearchMode) => {
    handleSubmit(query, _mode);
  };

  const handleSubmit = async (query: string, mode: SearchMode, imageData?: string) => {
    const submittedView = conversationViewRef.current;
    const request = { query, mode, imageData };
    setError(null);
    setRetryRequest(request);
    setLoading(true);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeId || "",
      role: "user",
      content: query,
      sources: [],
      mode,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const result = await sendToAI({
        query,
        mode,
        imageData,
        conversationId: activeId || undefined,
        history,
      });

      if (submittedView !== conversationViewRef.current) return;

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        conversation_id: result.conversationId || activeId || "",
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        mode,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (!activeId && result.conversationId) {
        setActiveId(result.conversationId);
        setConversations((prev) => [
          {
            id: result.conversationId,
            title: query.slice(0, 60),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setRetryRequest(null);
      if (result.conversationId) await loadMessages(result.conversationId);
    } catch (err) {
      if (submittedView !== conversationViewRef.current) return;
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryRequest) handleSubmit(retryRequest.query, retryRequest.mode, retryRequest.imageData);
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDeleted={handleDeleted}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-semibold text-white">Seekora AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block max-w-40 truncate">
              {user?.email}
            </span>
            <button
              onClick={() => void handleSignOut()}
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {messages.length === 0 && !loading && !error ? (
          <EmptyState onSuggestion={handleSuggestion} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                </div>
              ) : (
                messages.map((msg) => (
                  <AnswerCard key={msg.id} message={msg} />
                ))
              )}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 py-2">
                    <span className="text-sm">Seekora is thinking</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-400">{error}</p>
                    {retryRequest && (
                      <button
                        onClick={handleRetry}
                        className="text-xs text-red-400/70 hover:text-red-300 mt-2 underline"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <SearchInput onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
