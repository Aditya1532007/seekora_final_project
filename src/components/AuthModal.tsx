import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { showToast } from "@/components/Toast";

interface AuthModalProps {
  open: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onModeChange: (mode: "login" | "signup") => void;
}

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      showToast("Enter a valid email address!");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    try {
      const fn = mode === "login" ? signIn : signUp;
      const { error } = await fn(email, password);
      if (error) {
        showToast(error);
      } else {
        showToast(mode === "login" ? "Welcome back!" : "Account created!");
        onClose();
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 style={{ fontSize: "1.5rem" }}>
          Welcome <span className="grad-text">Aboard</span>
        </h2>
        <div className="auth-tabs">
          <button className={mode === "login" ? "on" : ""} onClick={() => onModeChange("login")}>
            Log In
          </button>
          <button className={mode === "signup" ? "on" : ""} onClick={() => onModeChange("signup")}>
            Sign Up
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              className="modal-input"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="modal-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="modal-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>
        <div className="social-row">
          <button onClick={() => showToast("Google sign-in coming soon!")}>G Google</button>
          <button onClick={() => showToast("GitHub sign-in coming soon!")}>⌥ GitHub</button>
        </div>
      </div>
    </div>
  );
}
