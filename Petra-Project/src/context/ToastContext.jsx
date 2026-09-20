import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const makeToast = (toast) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  tone: "info",
  title: "",
  message: "",
  duration: 4200,
  ...toast,
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const pushToast = (toast) => {
    const next = makeToast(toast);
    setToasts((current) => [...current, next]);
    window.setTimeout(() => removeToast(next.id), next.duration);
    return next.id;
  };

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      removeToast,
      success: (title, message) => pushToast({ tone: "success", title, message }),
      error: (title, message) => pushToast({ tone: "error", title, message, duration: 6200 }),
      warning: (title, message) => pushToast({ tone: "warning", title, message }),
      info: (title, message) => pushToast({ tone: "info", title, message }),
    }),
    [toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export const useToasts = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToasts must be used inside ToastProvider");
  }
  return context;
};

// Convenient alias
export const useToast = useToasts;

const TONE_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

export function ToastViewport() {
  const { toasts, removeToast } = useToasts();

  if (!toasts.length) return null;

  return (
    <div className="petra-toast-viewport" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => {
        const IconComponent = TONE_ICONS[toast.tone] || Info;
        return (
          <article key={toast.id} className={`petra-toast petra-toast-${toast.tone}`}>
            <div className="petra-toast-icon">
              <IconComponent size={18} />
            </div>
            <div className="petra-toast-copy">
              {toast.title && <strong>{toast.title}</strong>}
              <p>{toast.message}</p>
            </div>
            <button
              type="button"
              className="petra-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </article>
        );
      })}
    </div>
  );
}

export default ToastContext;
