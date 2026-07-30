'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;
let addToastGlobal: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null;

export function toast(message: string, type: ToastType = 'info') {
  addToastGlobal?.({ message, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { ...msg, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  const icons = {
    success: <CheckCircle size={16} color="var(--accent-emerald)" />,
    error:   <XCircle    size={16} color="var(--accent-rose)"    />,
    info:    <Info       size={16} color="var(--accent-blue)"    />,
  };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <span style={{ flex: 1, color: 'var(--text-primary)' }}>{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
