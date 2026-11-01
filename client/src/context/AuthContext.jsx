import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (u, p) => setUser((await api.login(u, p)).user);
  const register = async (u, p) => setUser((await api.register(u, p)).user);
  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}
