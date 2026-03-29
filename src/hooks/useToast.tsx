import { AlertTriangle, Check, Undo2 } from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const TOAST_DURATION = 2000;
const TOAST_EXIT_START = 1700;
const UNDO_DURATION = 8000;
const UNDO_EXIT_START = 7700;

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'undo';
  exiting?: boolean;
  onUndo?: () => void;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  /** Show a toast with an Undo button. Calls `onUndo` if clicked before timeout. */
  undo: (message: string, onUndo: () => void) => void;
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
    const tIds = timeoutIds.current;
    return () => {
      for (const id of tIds) clearTimeout(id);
      tIds.clear();
    };
  }, []);

  const scheduleRemoval = useCallback(
    (id: number, exitStart: number, duration: number) => {
      const t1 = setTimeout(() => {
        timeoutIds.current.delete(t1);
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
        );
      }, exitStart);
      timeoutIds.current.add(t1);

      const t2 = setTimeout(() => {
        timeoutIds.current.delete(t2);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
      timeoutIds.current.add(t2);
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: Toast['variant']) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-1), { id, message, variant }]);
      scheduleRemoval(id, TOAST_EXIT_START, TOAST_DURATION);
    },
    [scheduleRemoval],
  );

  const showUndo = useCallback(
    (message: string, onUndo: () => void) => {
      const id = nextId.current++;
      setToasts((prev) => [
        ...prev.filter((t) => t.variant !== 'undo'),
        { id, message, variant: 'undo' as const, onUndo },
      ]);
      scheduleRemoval(id, UNDO_EXIT_START, UNDO_DURATION);
    },
    [scheduleRemoval],
  );

  const success = useCallback(
    (message: string) => show(message, 'success'),
    [show],
  );
  const error = useCallback(
    (message: string) => show(message, 'error'),
    [show],
  );
  const undo = useCallback(
    (message: string, onUndo: () => void) => showUndo(message, onUndo),
    [showUndo],
  );

  return (
    <ToastContext.Provider value={{ success, error, undo }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex flex-col overflow-hidden bg-panel border ${
              toast.variant === 'error'
                ? 'border-red-500/30'
                : toast.variant === 'undo'
                  ? 'border-amber-500/30'
                  : 'border-success/30'
            } rounded-lg shadow-lg shadow-black/30 text-sm text-body ${
              toast.exiting ? 'animate-fade-out' : 'animate-fade-in'
            }`}
          >
            <div className="flex items-center gap-2 px-4 py-2.5">
              {toast.variant === 'error' ? (
                <AlertTriangle
                  size={16}
                  className="text-red-400 shrink-0"
                  aria-hidden="true"
                />
              ) : toast.variant === 'undo' ? (
                <Undo2
                  size={16}
                  className="text-amber-400 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Check
                  size={16}
                  className="text-accent shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className="flex-1">{toast.message}</span>
              {toast.variant === 'undo' && toast.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onUndo?.();
                    dismiss(toast.id);
                  }}
                  className="ml-2 px-2 py-0.5 text-xs font-semibold text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 rounded transition-colors"
                >
                  Undo
                </button>
              )}
            </div>
            {/* Countdown bar for undo toasts — pure CSS animation */}
            {toast.variant === 'undo' && (
              <div className="h-0.5 bg-amber-500/10">
                <div
                  className="h-full bg-amber-500/40 origin-left"
                  style={{
                    animation: `shrink-bar ${UNDO_DURATION}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
