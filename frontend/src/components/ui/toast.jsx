import { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Toast Context
const ToastContext = createContext();

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Toast Container
function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}

// Toast Component
function Toast({ id, type = 'info', title, message, duration, onClose }) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      removeToast(id);
      onClose?.();
    }, 200);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'border rounded-lg p-4 shadow-lg transition-all duration-200 transform',
        colors[type],
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconColors[type])} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-medium text-sm">{title}</p>
          )}
          {message && (
            <p className={cn('text-sm', title ? 'mt-1' : '')}>{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, toasts } = context;

  const toast = {
    success: (title, message, options = {}) => 
      addToast({ type: 'success', title, message, ...options }),
    error: (title, message, options = {}) => 
      addToast({ type: 'error', title, message, ...options }),
    warning: (title, message, options = {}) => 
      addToast({ type: 'warning', title, message, ...options }),
    info: (title, message, options = {}) => 
      addToast({ type: 'info', title, message, ...options }),
  };

  return { toast, toasts, removeToast };
}

