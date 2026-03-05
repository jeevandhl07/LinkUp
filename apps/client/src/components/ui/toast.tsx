import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string };

type ToastContextValue = {
  push: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo(
    () => ({
      push: (message: string) => {
        const toast = { id: Date.now(), message };
        setToasts((prev) => [...prev, toast]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 2500);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-lg border border-border bg-panel px-3 py-2 text-sm shadow-lg">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};