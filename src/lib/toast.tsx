import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  /** Push a toast notification. Returns its id (e.g. to dismiss early). */
  showToast: (message: string, variant?: ToastVariant, duration?: number) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { icon: any; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'bg-white border-green-200 text-green-800' },
  error: { icon: XCircle, classes: 'bg-white border-red-200 text-red-800' },
  info: { icon: Info, classes: 'bg-white border-blue-200 text-blue-800' },
  warning: { icon: AlertTriangle, classes: 'bg-white border-amber-200 text-amber-800' },
};

/** Wrap the app once (see main.tsx) to enable `useToast()` anywhere below it.
 *  This is the app-wide notification system (distinct from OnlineStore.tsx's
 *  own local inline toast banner used for its editor-specific confirmations). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { id, message, variant, duration }]);
    timers.current[id] = setTimeout(() => dismissToast(id), duration);
    return id;
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        className="fixed z-[100] top-4 right-4 left-4 sm:left-auto flex flex-col gap-2 items-stretch sm:items-end pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(t => {
          const { icon: Icon, classes } = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 w-full sm:w-auto sm:min-w-[280px] sm:max-w-sm px-4 py-3 rounded-xl border shadow-lg animate-[toast-in_0.2s_ease-out] ${classes}`}
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Fermer la notification"
                className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Read/dispatch toasts from any component under <ToastProvider>. Falls back
 *  to a no-op (rather than throwing) if used outside the provider, so it's
 *  safe to call from code paths that might render in isolation (tests). */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (message: string) => { console.warn('[toast] ToastProvider missing:', message); return ''; },
      dismissToast: () => {},
    };
  }
  return ctx;
}
