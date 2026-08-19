import { createContext, useContext, useMemo, useState } from 'react';

type AuthValue = {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState(sessionStorage.getItem('admin_token'));
  const setToken = (t: string | null) => {
    if (t) sessionStorage.setItem('admin_token', t);
    else sessionStorage.removeItem('admin_token');
    setTokenState(t);
  };
  const logout = () => setToken(null);
  const value = useMemo(() => ({ token, setToken, logout }), [token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
