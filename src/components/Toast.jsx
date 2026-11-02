import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import styles from '../styles/Toast.module.css';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback((message, variant = 'info', options = {}) => {
    const id = ++idSeq;
    const toast = {
      id,
      message,
      variant,
      duration: options.duration ?? 3500,
    };
    setToasts((prev) => [...prev, toast]);
    if (toast.duration > 0) {
      const timer = setTimeout(() => remove(id), toast.duration);
      timersRef.current.set(id, timer);
    }
    return id;
  }, [remove]);

  const api = useMemo(() => ({
    push,
    success: (msg, opts) => push(msg, 'success', opts),
    error: (msg, opts) => push(msg, 'error', opts),
    warning: (msg, opts) => push(msg, 'warning', opts),
    info: (msg, opts) => push(msg, 'info', opts),
    remove,
  }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.variant]}`}>
            <div className={styles.content}>{t.message}</div>
            <button className={styles.close} onClick={() => remove(t.id)} aria-label="Fechar">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
