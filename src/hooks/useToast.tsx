import { AlertTriangle, Check } from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error';
  exiting?: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timeoutIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clear all pending timeouts on unmount
  useEffect(() => {
    const ids = timeoutIds.current;
    return () => {
      for (const id of ids) clearTimeout(id);
      ids.clear();
    };
  }, []);

  const show = useCallback((message: string, variant: Toast['variant']) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-1), { id, message, variant }]);

    // Start exit animation after 1.7s, remove after 2s
    const t1 = setTimeout(() => {
      timeoutIds.current.delete(t1);
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
    }, 1700);
    timeoutIds.current.add(t1);

    const t2 = setTimeout(() => {
      timeoutIds.current.delete(t2);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
    timeoutIds.current.add(t2);
  }, []);

  const success = useCallback(
    (message: string) => show(message, 'success'),
    [show],
  );
  const error = useCallback(
    (message: string) => show(message, 'error'),
    [show],
  );

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 bg-[#1a1a2e] border ${
              toast.variant === 'error'
                ? 'border-red-500/30'
                : 'border-green-500/30'
            } rounded-lg px-4 py-2.5 shadow-lg shadow-black/30 text-sm text-gray-200 ${
              toast.exiting ? 'animate-fade-out-down' : 'animate-fade-in-up'
            }`}
          >
            {toast.variant === 'error' ? (
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
            ) : (
              <Check size={16} className="text-green-400 shrink-0" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
