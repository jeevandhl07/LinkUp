import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/endpoints";
import { setAccessToken } from "../api/http";
import { User } from "../types/models";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; name: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("linkup_access_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const localToken = localStorage.getItem("linkup_access_token");
      if (localToken) {
        setAccessToken(localToken);
        try {
          const data = await authApi.me();
          setUser(data.user);
        } catch {
          setAccessToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    void boot();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: async ({ email, password }) => {
        const data = await authApi.login({ email, password });
        setAccessToken(data.accessToken);
        setToken(data.accessToken);
        setUser(data.user);
      },
      register: async ({ email, name, password }) => {
        const data = await authApi.register({ email, name, password });
        setAccessToken(data.accessToken);
        setToken(data.accessToken);
        setUser(data.user);
      },
      logout: async () => {
        await authApi.logout();
        setAccessToken(null);
        setToken(null);
        setUser(null);
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};