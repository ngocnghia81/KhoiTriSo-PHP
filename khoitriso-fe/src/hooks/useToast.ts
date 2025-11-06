/**
 * Toast Hook
 * Simple toast notification system
 */

'use client';

import { useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

let toastId = 0;

/**
 * Hook to show toast notifications
 */
export function useToast() {
  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const { type = 'info', duration = 3000 } = options;
    
    if (typeof window === 'undefined') return;
    
    const id = `toast-${toastId++}`;
    const toastEl = document.createElement('div');
    toastEl.id = id;
    toastEl.className = `fixed top-4 right-4 z-[9999] px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 max-w-md animate-slide-in-right`;
    
    // Type-specific styling
    const typeStyles = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white',
    };
    
    toastEl.className += ` ${typeStyles[type]}`;
    toastEl.textContent = message;
    
    // Add to document
    document.body.appendChild(toastEl);
    
    // Auto remove after duration
    setTimeout(() => {
      toastEl.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => {
        if (document.body.contains(toastEl)) {
          document.body.removeChild(toastEl);
        }
      }, 300);
    }, duration);
  }, []);
  
  const success = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'success', duration });
  }, [showToast]);
  
  const error = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'error', duration });
  }, [showToast]);
  
  const warning = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'warning', duration });
  }, [showToast]);
  
  const info = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'info', duration });
  }, [showToast]);
  
  return {
    showToast,
    success,
    error,
    warning,
    info,
  };
}

