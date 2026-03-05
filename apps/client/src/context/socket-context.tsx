import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";

type SocketContextValue = { socket: Socket | null };
const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const envSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
const SOCKET_URL =
  envSocketUrl && envSocketUrl.trim().length > 0
    ? envSocketUrl
    : `${window.location.protocol}//${window.location.hostname}:5000`;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      return;
    }

    const next = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      withCredentials: true,
    });

    setSocket(next);
    return () => {
      next.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket }), [socket]);
  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
