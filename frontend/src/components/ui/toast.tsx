'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

type ToastVariant = 'default' | 'success' | 'info' | 'warning' | 'destructive';

interface ToastProps {
  id: string;
  title?: string;
  description: string;
  variant: ToastVariant;
}

interface ToastOptions {
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  toasts: ToastProps[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, title, description, variant }]);

      if (duration) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

const variantStyles = {
  default: 'bg-white text-gray-800 border-gray-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  destructive: 'bg-red-50 text-red-800 border-red-200',
};

const variantIcons = {
  default: null,
  success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
  warning: <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />,
  destructive: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
};

function Toast({ 
  id, 
  title, 
  description, 
  variant = 'default', 
  onClose 
}: ToastProps & { onClose: () => void }) {
  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg ring-1 ring-black ring-opacity-5 transition-all transform animate-in slide-in-from-right-full ${variantStyles[variant]}`}
    >
      <div className="p-4">
        <div className="flex items-start">
          {variantIcons[variant] && (
            <div className="flex-shrink-0 mr-3">
              {variantIcons[variant]}
            </div>
          )}
          <div className="flex-1">
            {title && (
              <p className="text-sm font-medium">{title}</p>
            )}
            <p className={`text-sm ${title ? 'mt-1' : ''}`}>{description}</p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 