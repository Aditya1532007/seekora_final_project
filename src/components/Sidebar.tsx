import { useEffect, useState } from "react";
import { Plus, MessageSquare, Trash2, Loader2, X } from "lucide-react";
import { deleteConversation, getConversations } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Conversation } from "@/types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDeleted, isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allConvs, setAllConvs] = useState<Conversation[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAllConvs([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    getConversations()
      .then((items) => {
        if (active) setAllConvs(items);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load conversations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (conversations.length > 0) {
      setAllConvs((prev) => {
        const existing = new Map(prev.map((c) => [c.id, c]));
        for (const c of conversations) {
          if (!existing.has(c.id)) {
            existing.set(c.id, c);
          } else {
            existing.set(c.id, { ...existing.get(c.id)!, ...c });
          }
        }
        return Array.from(existing.values()).sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
      });
    }
  }, [conversations]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    setError(null);
    try {
      await deleteConversation(id);
      setAllConvs((prev) => prev.filter((c) => c.id !== id));
      onDeleted(id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete conversation.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Seekora AI</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium rounded-xl py-2.5 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {error && (
            <p role="alert" className="mx-2 my-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : allConvs.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8 px-4">
              No conversations yet. Start by asking a question.
            </p>
          ) : (
            allConvs.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  activeId === conv.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-sm truncate">{conv.title}</span>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                  title="Delete conversation"
                >
                  {deletingId === conv.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
