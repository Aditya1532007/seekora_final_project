import { Loader2, Sparkles } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthScreen } from "@/components/AuthScreen";
import { ChatView } from "@/components/ChatView";
import { BackgroundFX, CursorFX } from "@/components/BackgroundFX";

function AppContent() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-white">Seekora server unavailable</h1>
          <p className="text-slate-400 mt-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <ChatView />;
}

export default function App() {
  return (
    <AuthProvider>
      <BackgroundFX />
      <CursorFX />
      <AppContent />
    </AuthProvider>
  );
}
