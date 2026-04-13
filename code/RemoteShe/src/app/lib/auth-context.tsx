// Auth has been stubbed out — Supabase replaced by Cloudflare Workers + KV.
// Admin pages are disabled; public job search works without authentication.
import React, { createContext, useContext } from "react";

interface AuthContextType {
  user: null;
  loading: false;
  accessToken: null;
  signIn: () => Promise<void>;
  signUp: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  accessToken: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: null,
      loading: false,
      accessToken: null,
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
