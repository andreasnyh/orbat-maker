import { Check } from 'lucide-react';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

interface Toast {
  id: number;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
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

  const success = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-1), { id, message }]);

    // Start exit animation after 1.7s, remove after 2s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
    }, 1700);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ success }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg px-4 py-2.5 shadow-lg shadow-black/30 text-sm text-gray-200 ${
              toast.exiting ? 'animate-fade-out-down' : 'animate-fade-in-up'
            }`}
          >
            <Check size={16} className="text-green-400 shrink-0" />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
