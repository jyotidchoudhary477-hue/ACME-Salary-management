import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastItem = { id: number; message: string; tone: 'success' | 'error' | 'info' };

type ToastContextValue = {
  push: (message: string, tone?: ToastItem['tone']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  const tones = {
    success: 'bg-emerald-800 text-white',
    error: 'bg-orange-800 text-white',
    info: 'bg-slate-800 text-white',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-semibold shadow-lg animate-rise ${tones[t.tone]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
