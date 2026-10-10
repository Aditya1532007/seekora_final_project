import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  planCode: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<AuthUser | null>("/auth/me")
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not connect to Seekora.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const signedInUser = await apiRequest<AuthUser>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setUser(signedInUser);
      setError(null);
      return { error: null };
    } catch (requestError) {
      return { error: requestError instanceof Error ? requestError.message : "Sign-in failed." };
    }
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    try {
      const newUser = await apiRequest<AuthUser>("/auth/signup", {
        method: "POST",
        body: { fullName, email, password },
      });
      setUser(newUser);
      setError(null);
      return { error: null };
    } catch (requestError) {
      return { error: requestError instanceof Error ? requestError.message : "Account creation failed." };
    }
  };

  const signOut = async () => {
    await apiRequest<unknown>("/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
